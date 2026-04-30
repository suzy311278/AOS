---
description: Review markdown documents, plans, and strategy files using Codex. Unlike /codex:review (which only reviews git diffs), this reviews the actual content of specified files for gaps, contradictions, feasibility, and completeness.
argument-hint: '<file-path-or-glob> [--wait|--background]'
allowed-tools: Read, Glob, Grep, Bash(node:*), AskUserQuestion
---

Review markdown documents, plans, or strategy files using Codex.

Raw slash-command arguments:
`$ARGUMENTS`

## Purpose

`/codex:review` and `/codex:adversarial-review` only review git diffs (code changes). This command fills the gap: it reviews the **content** of markdown files, brainstorming docs, architecture plans, implementation plans, and strategy documents.

## What to review for

When sending to Codex, frame the review around:
- **Feasibility**: Are the proposed approaches technically sound? Are there hidden complexities?
- **Completeness**: Are there missing considerations, edge cases, or gaps?
- **Contradictions**: Do any sections contradict each other?
- **Prioritization**: Is the suggested ordering/phasing sensible?
- **Risks**: What could go wrong with the proposed approach?
- **Specificity**: Are recommendations concrete enough to act on, or too vague?

## Execution flow

1. **Parse arguments**: Extract file paths or glob patterns from `$ARGUMENTS`. Strip `--wait` and `--background` flags.

2. **Collect file contents**: Read each matched file. If a glob is provided (e.g., `brainstorming/*.md`), expand it. Concatenate all file contents with clear file-path headers.

3. **Build the review prompt**: Construct a prompt like:
```
Review the following documents for feasibility, completeness, contradictions, prioritization issues, and risks. Be critical and specific. For each finding, reference the specific file and section.

---
File: <path>
<content>
---
File: <path>
<content>
```

4. **Send to Codex via task**: Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task "<the review prompt>"
```

   If the prompt is too long for a CLI argument, write it to a temporary file and use `--prompt-file`:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task --prompt-file /tmp/doc-review-prompt.md
```

5. **Execution mode**:
   - If `--wait` is in arguments: run in foreground
   - If `--background` is in arguments: run with `Bash(run_in_background: true)`
   - Otherwise: estimate total file size. If under 5KB, recommend wait. Otherwise recommend background. Ask user via `AskUserQuestion`.

6. **Return output verbatim**. Do not fix, summarize, or editorialize. Return Codex's output exactly as received.

## Examples

```
/review-docs brainstorming/commercial-site-architecture.md
/review-docs brainstorming/*.md --background
/review-docs REDESIGN_IMPLEMENTATION_PLAN.md AUTH_IMPLEMENTATION_PLAN.md
```

## Important

- This is a review-only command. Do not fix issues or apply changes.
- If no files match the provided path/glob, tell the user and suggest alternatives.
- The `CLAUDE_PLUGIN_ROOT` for Codex is at: `/Users/knowprajjwal/.claude/plugins/cache/openai-codex/codex/1.0.2`
