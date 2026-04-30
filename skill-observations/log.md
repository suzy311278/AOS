# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

## 2026-03-17

### Observation 1: NotebookLM MCP download_artifact fails without fresh auth
**Status:** ACTIONED - Applied to generate-audio skill (Step 0: Auth Pre-Flight + Step 2e retry-after-reauth)
**Date:** 2026-03-17
**Session context:** Running the generate-audio pipeline to batch-generate lesson audio
**Skill:** generate-audio
**Type:** internal
**Phase/Area:** Step 2f (Download audio)

**Issue:** The `download_artifact` MCP tool consistently returned "Download failed for audio" even after the audio was marked completed. Curling the audio_url directly returned a Google login HTML page (auth required). Running `nlm login` then `refresh_auth` MCP tool fixed the issue and the next download succeeded. This wasted one NotebookLM generation (the notebook had to be deleted and recreated).

**Suggested improvement:** Add a pre-flight step to the generate-audio skill: before starting the batch, run `mcp__notebooklm__refresh_auth` (and if that fails, `nlm login` then refresh). This ensures auth tokens are fresh before any generation begins. Also add a retry-after-reauth step in 2f so that if download fails, it automatically refreshes auth and retries once before skipping.

**Principle:** MCP tools that depend on browser-session authentication can silently fail with opaque errors. Skills that use such tools should include an auth-refresh pre-flight and a retry-with-reauth pattern for download steps.

### Observation 2: source_add with text param wastes context window and adds tool calls
**Status:** ACTIONED - Applied to generate-audio skill (Step 2b: use source_type="file")
**Date:** 2026-03-17
**Session context:** Running the generate-audio pipeline to batch-generate lesson audio
**Skill:** generate-audio
**Type:** internal
**Phase/Area:** Step 2c (Add source text)

**Issue:** The skill instructed to use `source_type="text"` with the `text` parameter, which required reading the entire extracted lesson text (6-50KB) into the conversation context via a Read tool call, then passing it as a string parameter to source_add. This wastes context window (each lesson consumes 6-50K tokens of context), requires an extra tool approval for the Read, and balloons the conversation for batch processing.

**Suggested improvement:** Use `source_type="file"` with `file_path` pointing to the already-extracted temp file. The MCP tool uploads the file directly without it ever entering the conversation context.

**Principle:** When an MCP tool supports both inline content and file-path parameters, always prefer the file-path variant in batch workflows to preserve context window and reduce tool calls.

### Observation 3: Polling pattern generates excessive tool calls
**Status:** ACTIONED - Applied to generate-audio skill (Step 2d: 90s initial wait)
**Date:** 2026-03-17
**Session context:** Running the generate-audio pipeline to batch-generate lesson audio
**Skill:** generate-audio
**Type:** internal
**Phase/Area:** Step 2e (Poll for completion)

**Issue:** Each poll cycle required two separate tool calls: `sleep 30` (Bash) + `studio_status` (MCP). For the test lesson, it took 3 poll cycles = 6 tool approvals just for waiting. Audio generation for "short" format consistently takes 90-120 seconds, so the 30-second initial wait was too aggressive.

**Suggested improvement:** Start with `sleep 90` (one tool call) since short-format audio reliably takes 90+ seconds. Then poll with 30-second intervals only if still in progress. This cuts typical polling from 6 tool calls to 2-3.

**Principle:** When a skill polls an async process, calibrate the initial wait to the typical completion time rather than using a fixed short interval. This minimizes both tool calls and user approvals.

### Observation 4: Post-processing steps should be chained into single Bash calls
**Status:** ACTIONED - Applied to generate-audio skill (Step 2g: single chained command)
**Date:** 2026-03-17
**Session context:** Running the generate-audio pipeline to batch-generate lesson audio
**Skill:** generate-audio
**Type:** internal
**Phase/Area:** Steps 2i-2l (Upload, insert, log, cleanup)

**Issue:** The original skill had upload, insert, log, and cleanup as four separate steps. Each required its own Bash tool call and user approval. These are sequential operations with no branching logic, making them ideal for `&&` chaining.

**Suggested improvement:** Chain upload + insert + log + cleanup into a single `&&`-joined Bash command. This reduces 4 tool approvals to 1.

**Principle:** When a skill has sequential, non-branching shell commands, always chain them with `&&` into a single Bash call. Each separate tool call costs a user approval in most permission modes.
