---
name: generate-audio
description: Generate podcast-style audio for lessons using NotebookLM, convert to MP3, upload to R2, and insert AudioPlayer into MDX
user_invocable: true
---

# Audio Generation Pipeline

You are orchestrating audio generation for the Sustainability Academy. This skill generates podcast-style lesson audio using NotebookLM MCP tools, converts it, uploads to Cloudflare R2, and updates the MDX files.

## Setup

The helper script is at `scripts/audio-pipeline.ts`. Run it via `npx tsx scripts/audio-pipeline.ts <command>`.

R2 bucket: `greentryst-audios`
R2 public URL: `https://pub-033ee478bfa542229216e3781c99cb96.r2.dev`
File naming: `/<courseId>/<lessonId_with_underscores>.mp3` (e.g., `/vm0042/0_1.mp3`)

## Handling Arguments

Parse the user's input after `/generate-audio`:
- `status` - Show the dashboard only (run `npx tsx scripts/audio-pipeline.ts status`) and stop
- `--course <id>` - Filter to a specific course
- `--limit <N>` - Process at most N lessons (default: fill remaining daily quota up to 19)
- No args - process up to 19 lessons (minus today's usage)

## Step 0: Auth Pre-Flight

**Always run this before any generation work.** NotebookLM MCP tools silently fail with opaque errors when auth tokens are stale.

1. Call `mcp__notebooklm__refresh_auth`. If it succeeds, proceed.
2. If it fails, run `nlm login` via Bash, then call `refresh_auth` again.
3. If auth still fails, stop and tell the user to fix authentication manually.

## Step 1: Get the Batch

Run these two commands in parallel (single Bash call each):
- `npx tsx scripts/audio-pipeline.ts next-batch` with any `--limit` or `--course` flags
- `npx tsx scripts/audio-pipeline.ts status`

Parse the JSON batch output. If empty, tell the user all lessons have audio (or the daily limit is reached) and stop.

Show the user the batch summary (count and course/lesson range) and proceed.

## Step 2: Process Each Lesson

For each lesson in the batch, execute these steps sequentially. If any step fails, log the error, skip this lesson, and continue with the next one.

### 2a. Extract text
```bash
npx tsx scripts/audio-pipeline.ts extract <courseId> <lessonId> > /tmp/audio-pipeline/<courseId>_<lessonId>.txt
```
Create `/tmp/audio-pipeline/` if it doesn't exist (add `mkdir -p /tmp/audio-pipeline &&` before the first extract).

### 2b. Create notebook + add source (minimize tool calls)

Create the notebook, then add the source using `source_type="file"` to avoid reading text into context:

1. Call `notebook_create` with title: `"Audio: <courseTitle> - <lessonTitle>"`
2. Call `source_add` with:
   - `notebook_id`: the ID from above
   - `source_type`: `"file"`
   - `file_path`: `/tmp/audio-pipeline/<courseId>_<lessonId>.txt`
   - `wait`: `true`

**IMPORTANT:** Use `source_type="file"` with `file_path` pointing to the extracted text file. Do NOT read the temp file into the conversation and pass it as `text`. This avoids wasting context window and eliminates a tool approval.

### 2c. Generate audio
Call `studio_create` with:
- `notebook_id`: the ID from step 2b
- `artifact_type`: `"audio"`
- `audio_format`: `"deep_dive"`
- `audio_length`: `"short"`
- `focus_prompt`: `"You are teachers at Green Tryst Academy. Begin with a concise 30-second summary of the lesson. Then guide the listener through the lesson content using a clear, teacher-like tone — use analogies and real-world examples to make concepts stick. Stay strictly within the lesson content; do not introduce outside topics. Keep the audio short and focused."`
- `confirm`: `true`

### 2d. Poll for completion (single Bash sleep, then MCP check)

**Minimize tool calls during polling.** Audio generation with a focus_prompt typically takes 200-350 seconds.

1. First, run a single `sleep 350` via Bash (one tool call covers the initial wait). The status transitions from "unknown" to "completed" with a delay. Downloading while status is "unknown" will fail even if the audio URL is present.
2. Then call `studio_status`. Only proceed to download if `status` is `"completed"` (not `"unknown"`).
3. If still in progress or "unknown", run `sleep 60` + `studio_status`. Repeat up to 6 more times (max ~10 minutes total).
4. If it times out after all polls, skip this lesson.

### 2e. Download audio (with retry-after-reauth)

Call `download_artifact` with:
- `notebook_id`: the ID from step 2b
- `artifact_type`: `"audio"`
- `output_path`: `/tmp/audio-pipeline/<courseId>_<lessonId>.mp4`

**If download fails:** This is almost always an auth issue. Run `mcp__notebooklm__refresh_auth`, then retry the download once. If it fails again, run `nlm login` via Bash, call `refresh_auth`, and retry a final time. If still failing, skip this lesson (but do NOT delete the notebook yet so the user can manually download).

### 2f. Delete notebook + convert to MP3 (parallel)

Run these in parallel (two tool calls in one message):

1. `notebook_delete` with `confirm: true`
2. Bash: `ffmpeg -i /tmp/audio-pipeline/<courseId>_<lessonId>.mp4 -codec:a libmp3lame -b:a 128k -y /tmp/audio-pipeline/<courseId>_<lessonId>.mp3 2>&1 | tail -3`

### 2g. Upload + insert + log + cleanup (single chained Bash command)

Combine all post-processing into ONE Bash call to minimize approvals:

```bash
wrangler r2 object put greentryst-audios/<courseId>/<lessonId_underscored>.mp3 --file /tmp/audio-pipeline/<courseId>_<lessonId>.mp3 --remote 2>&1 | tail -3 && npx tsx scripts/audio-pipeline.ts insert <courseId> <lessonId> "https://pub-033ee478bfa542229216e3781c99cb96.r2.dev/<courseId>/<lessonId_underscored>.mp3" && npx tsx scripts/audio-pipeline.ts log <courseId> <lessonId> && rm -f /tmp/audio-pipeline/<courseId>_<lessonId>.*
```

The lesson ID uses underscores in the filename (e.g., `0.1` becomes `0_1`).

## Step 3: Post-Batch Summary

After processing all lessons, show a brief summary:
- How many succeeded vs failed
- Which lessons were processed
- Updated daily usage count

Run `npx tsx scripts/audio-pipeline.ts status` to show the updated dashboard.

## Step 4: Commit

Auto-commit all modified MDX files with a message like:
```
Add audio to N lessons (course1 X.X-X.X, course2 X.X-X.X, ...)
```

Only commit if at least one lesson was successfully processed. Stage only the modified `.mdx` files (not log files or temp files).

## Tool Call Budget Per Lesson

Target: ~7-8 tool calls per lesson (down from ~14+ in v1):
1. Bash: extract text
2. MCP: notebook_create
3. MCP: source_add (file upload, no context read)
4. MCP: studio_create
5. Bash: sleep 350
6. MCP: studio_status (+ possibly 1-2 more poll rounds)
7. MCP: download_artifact
8. MCP: notebook_delete (parallel with ffmpeg below)
9. Bash: ffmpeg convert (parallel with delete above)
10. Bash: upload + insert + log + cleanup (single chained command)

## Important Notes

- **Auth pre-flight**: Always refresh auth before starting. Stale tokens cause silent download failures.
- **Rate limit**: NotebookLM allows 19 generations per 24 hours. The script tracks this. Never exceed it.
- **Notebook cleanup**: Always delete the NotebookLM notebook after downloading the audio. NotebookLM has a limit on total notebooks. Exception: if download fails after all retries, keep the notebook so the user can manually retrieve the audio.
- **Error recovery**: If a lesson fails at any step, it stays without an AudioPlayer tag and will appear in the next batch automatically.
- **Idempotent**: Running the pipeline again skips lessons that already have `<AudioPlayer` in their MDX.
- **No separate state file**: The MDX files are the source of truth for which lessons have audio.
- **Context efficiency**: Never read extracted text files into the conversation. Use `source_type="file"` for source_add. Chain Bash commands with `&&` to minimize tool calls. Run independent steps in parallel.
