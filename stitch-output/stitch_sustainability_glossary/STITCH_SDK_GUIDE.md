# Stitch SDK Setup Guide

## Overview

Google Stitch is an AI-powered UI design tool that generates screens from text prompts. We use the official `@google/stitch-sdk` (from `google-labs-code`) to programmatically generate, edit, and iterate on designs from the command line.

This guide covers setup, usage, known issues, and workarounds discovered during integration.

## Prerequisites

- Node.js 18+
- A Google account with access to [stitch.withgoogle.com](https://stitch.withgoogle.com)
- A `STITCH_API_KEY` (obtained from the Stitch platform or Google AI Studio)

## Installation

The SDK is already installed as a dev dependency:

```bash
npm install --save-dev @google/stitch-sdk
```

Current version: `0.0.3`

## Authentication

Add your API key to `.env.local`:

```
STITCH_API_KEY=your-key-here
```

The script (`scripts/stitch-generate.ts`) automatically loads `.env.local` at startup. The SDK reads `STITCH_API_KEY` from the environment.

## CLI Script: `scripts/stitch-generate.ts`

A custom CLI wrapper around the SDK. Run with `npx tsx`:

### Commands

```bash
# List all your Stitch projects
npx tsx scripts/stitch-generate.ts list-projects

# List screens in a project
npx tsx scripts/stitch-generate.ts list-screens --project <PROJECT_ID>

# Generate a new screen from a text prompt
npx tsx scripts/stitch-generate.ts generate \
  --prompt "A landing page with hero section and course cards" \
  --device DESKTOP \
  --project <PROJECT_ID> \
  --design-system \
  --label my-design

# Edit an existing screen
npx tsx scripts/stitch-generate.ts edit \
  --project <PROJECT_ID> \
  --screen <SCREEN_ID> \
  --prompt "Make the sidebar collapsible"

# Generate design variants
npx tsx scripts/stitch-generate.ts variants \
  --project <PROJECT_ID> \
  --screen <SCREEN_ID> \
  --prompt "Try different layouts" \
  --count 3 \
  --range EXPLORE \
  --aspects LAYOUT,COLOR_SCHEME

# Download HTML + screenshot for a specific screen
npx tsx scripts/stitch-generate.ts get \
  --project <PROJECT_ID> \
  --screen <SCREEN_ID> \
  --label my-screen
```

### Flags Reference

| Flag | Commands | Description |
|------|----------|-------------|
| `--prompt` | generate, edit, variants | The text prompt (required) |
| `--device` | generate | `DESKTOP`, `MOBILE`, `TABLET`, or `AGNOSTIC` (default: `DESKTOP`) |
| `--project` | all except list-projects | Stitch project ID |
| `--screen` | edit, variants, get | Stitch screen ID |
| `--design-system` | generate | Prepends `verdant_core/DESIGN.md` to the prompt |
| `--label` | generate, edit, get | Output filename prefix (default: command name) |
| `--count` | variants | Number of variants, 1 to 5 (default: 3) |
| `--range` | variants | `REFINE`, `EXPLORE`, or `REIMAGINE` (default: `EXPLORE`) |
| `--aspects` | variants | Comma-separated: `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT` |

### Output

All generated files are saved to `stitch_sustainability_glossary/generated/`:
- `<label>_<timestamp>.html` (the screen HTML)
- `<label>_<timestamp>.png` (the screenshot)
- `<label>_<timestamp>_raw.json` (only when using callTool fallback)

## Known Issues and Workarounds

### Issue 1: `project.generate()` fails with "Cannot read properties of undefined (reading 'screens')"

**Symptom:** Calling `project.generate(prompt, deviceType)` throws:
```
Cannot read properties of undefined (reading 'screens')
```

**When it happens:** Frequently with longer prompts (especially when `--design-system` prepends the full DESIGN.md). Shorter prompts (under ~500 characters) tend to work.

**Root cause:** The SDK's internal response parsing breaks on certain API response structures. The API returns the data successfully, but the SDK fails to extract it.

**Workaround (implemented in script):** The script automatically falls back to `stitch.callTool("generate_screen_from_text", ...)` which calls the same API but returns raw JSON that we parse ourselves. The fallback:
1. Calls `callTool` with projectId, prompt, and deviceType
2. Extracts screen data from `result.outputComponents[1].design.screens[0]`
3. Downloads HTML and screenshot from their `downloadUrl` fields
4. Saves a `_raw.json` file with the full API response for inspection

**If both fail:** Save whatever came back as raw JSON and extract manually with:
```bash
cat stitch_sustainability_glossary/generated/<file>_raw.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
screen = data['outputComponents'][1]['design']['screens'][0]
print('HTML:', screen['htmlCode']['downloadUrl'])
print('PNG:', screen['screenshot']['downloadUrl'])
"
```
Then download with `curl -sL -o output.html "<URL>"`.

### Issue 2: `create_project` returns a name, not a usable project object

**Symptom:** After creating a project via `callTool("create_project", ...)`, the result looks like:
```json
{
  "name": "projects/12143224116306032599",
  "origin": "STITCH",
  "projectType": "PROJECT_DESIGN",
  "title": "SA Design - 2026-03-21T03-16-18",
  "visibility": "PRIVATE"
}
```

Trying to use `stitch.projects()` and grabbing the last one does not reliably return the new project.

**Workaround (implemented in script):** Extract the ID directly from the `name` field:
```typescript
const newId = result?.name?.split("/").pop();
project = stitch.project(newId);
```

### Issue 3: Service temporarily unavailable

**Symptom:**
```
Tool Call Failed [generate_screen_from_text]: The service is currently unavailable.
```

**When it happens:** Intermittently, especially during high-load periods or when sending very large prompts (full DESIGN.md + detailed page spec).

**Workaround:**
1. Wait 30 to 60 seconds and retry
2. Shorten the prompt (remove the `--design-system` flag, reference design rules inline instead)
3. If the API was recently updated by Google, check [stitch.withgoogle.com](https://stitch.withgoogle.com) to confirm the service is operational

### Issue 4: Device type is per-screen, not per-project

**Symptom:** Creating a project does not set a "web" vs "mobile" mode. All projects are generic containers.

**Clarification:** The `deviceType` parameter is passed at screen generation time, not project creation. Always pass `--device DESKTOP` when generating web designs. If you omit it, the SDK may default to mobile.

### Issue 5: callTool response structure

**Symptom:** The raw response from `callTool("generate_screen_from_text")` has a non-obvious structure.

**Response structure:**
```
outputComponents[0] = { designSystem: { ... } }     // Generated/matched design system
outputComponents[1] = { design: { screens: [...] } } // The actual screen(s)
outputComponents[2] = { text: "..." }                 // AI description of what was generated
outputComponents[3-5] = { suggestion: "..." }         // Follow-up prompt suggestions
```

Each screen object contains:
```
screen.htmlCode.downloadUrl    // URL to download the HTML file
screen.screenshot.downloadUrl  // URL to download the PNG screenshot
screen.htmlCode.mimeType       // "text/html"
screen.name                    // "projects/<pid>/screens/<sid>"
screen.deviceType              // "DESKTOP", "MOBILE", etc.
screen.width / screen.height   // Viewport dimensions used
screen.prompt                  // The prompt that was sent
```

Download URLs are temporary Google Cloud URLs. Download immediately after generation.

## SDK API Reference (Quick)

```typescript
import { stitch } from "@google/stitch-sdk";

// List projects
const projects = await stitch.projects();

// Reference a project (no API call)
const project = stitch.project("projectId");

// Generate a screen
const screen = await project.generate("prompt", "DESKTOP");

// Edit an existing screen
const edited = await screen.edit("make the header larger");

// Create variants
const variants = await screen.variants("try different colors", {
  variantCount: 3,
  creativeRange: "EXPLORE",  // REFINE | EXPLORE | REIMAGINE
  aspects: ["LAYOUT", "COLOR_SCHEME"],
});

// Get assets
const htmlUrl = await screen.getHtml();       // Returns download URL
const screenshotUrl = await screen.getImage(); // Returns download URL

// Low-level tool call (more reliable for generation)
const result = await stitch.callTool("generate_screen_from_text", {
  projectId: "...",
  prompt: "...",
  deviceType: "DESKTOP",
});

// Create a project
const newProject = await stitch.callTool("create_project", {
  title: "My Project",
});
```

## Tips for Better Results

1. **Be specific about "desktop website"** in your prompt. Stitch defaults toward mobile app designs if not specified.
2. **Name actual content** (course titles, stats, button labels) instead of using placeholder text. Stitch renders what you describe.
3. **Reference fonts and colors inline** when not using `--design-system`: "Use Manrope for headings, Inter for body, deep teal (#005c55) primary."
4. **Keep prompts under ~800 words** for reliable `project.generate()`. Use `callTool` fallback for longer prompts.
5. **Specify "no 1px borders"** explicitly if using the Verdant Core style, otherwise Stitch defaults to bordered cards.
6. **Use `--label` to organize outputs** (e.g., `--label homepage`, `--label lesson-page`, `--label quiz`).

## Our Stitch Projects

| Project ID | Contents |
|------------|----------|
| `12143224116306032599` | SA Redesign: 7 homepage screens (our main working project) |
| `7339727773534054907` | Original sustainability glossary screens (6 screens) |
| `12007501965012811342` | Original sustainability glossary screens (4 screens) |
