#!/usr/bin/env npx tsx
/**
 * Stitch SDK CLI - Generate, edit, and explore UI designs from the command line.
 *
 * Usage:
 *   npx tsx scripts/stitch-generate.ts generate --prompt "..." [--device DESKTOP] [--project ID] [--design-system]
 *   npx tsx scripts/stitch-generate.ts edit --screen ID --prompt "..." [--project ID]
 *   npx tsx scripts/stitch-generate.ts variants --screen ID --prompt "..." [--count 3] [--range EXPLORE] [--aspects LAYOUT,COLOR_SCHEME]
 *   npx tsx scripts/stitch-generate.ts list-projects
 *   npx tsx scripts/stitch-generate.ts list-screens --project ID
 *   npx tsx scripts/stitch-generate.ts get --screen ID [--project ID]
 *
 * Requires STITCH_API_KEY in .env.local or environment.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const eqIdx = line.indexOf("=");
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

if (!process.env.STITCH_API_KEY) {
  console.error("Error: STITCH_API_KEY not found. Add it to .env.local or set it in your environment.");
  process.exit(1);
}

async function main() {
  // Dynamic import (ESM module)
  const { stitch } = await import("@google/stitch-sdk");

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help") {
    printHelp();
    return;
  }

  const flags = parseFlags(args.slice(1));

  switch (command) {
    case "generate":
      await handleGenerate(stitch, flags);
      break;
    case "edit":
      await handleEdit(stitch, flags);
      break;
    case "variants":
      await handleVariants(stitch, flags);
      break;
    case "list-projects":
      await handleListProjects(stitch);
      break;
    case "list-screens":
      await handleListScreens(stitch, flags);
      break;
    case "get":
      await handleGetScreen(stitch, flags);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      flags[key] = val;
    }
  }
  return flags;
}

function loadDesignSystem(): string {
  const designPath = resolve(__dirname, "../stitch_sustainability_glossary/verdant_core/DESIGN.md");
  if (!existsSync(designPath)) {
    console.warn("Warning: DESIGN.md not found at", designPath);
    return "";
  }
  return readFileSync(designPath, "utf-8");
}

function ensureOutputDir(): string {
  const outDir = resolve(__dirname, "../stitch_sustainability_glossary/generated");
  mkdirSync(outDir, { recursive: true });
  return outDir;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
}

async function saveScreenAssets(screen: any, label: string): Promise<void> {
  const outDir = ensureOutputDir();
  const ts = timestamp();
  const prefix = `${label}_${ts}`;

  // Get HTML
  try {
    const htmlUrl = await screen.getHtml();
    const htmlPath = join(outDir, `${prefix}.html`);
    await downloadFile(htmlUrl, htmlPath);
    console.log(`  HTML saved: ${htmlPath}`);
  } catch (e: any) {
    console.error(`  Failed to get HTML: ${e.message}`);
  }

  // Get screenshot
  try {
    const imgUrl = await screen.getImage();
    const imgPath = join(outDir, `${prefix}.png`);
    await downloadFile(imgUrl, imgPath);
    console.log(`  Screenshot saved: ${imgPath}`);
  } catch (e: any) {
    console.error(`  Failed to get screenshot: ${e.message}`);
  }
}

async function handleGenerate(stitch: any, flags: Record<string, string>) {
  const prompt = flags.prompt;
  if (!prompt) {
    console.error("Error: --prompt is required for generate.");
    process.exit(1);
  }

  const projectId = flags.project;
  const device = flags.device || "DESKTOP";
  const useDesignSystem = flags["design-system"] !== undefined;

  let fullPrompt = prompt;
  if (useDesignSystem) {
    const ds = loadDesignSystem();
    if (ds) {
      fullPrompt = `Use the following design system for styling, typography, colors, spacing, and component rules:\n\n${ds}\n\nNow generate:\n${prompt}`;
      console.log("Design system loaded and prepended to prompt.");
    }
  }

  console.log(`Generating screen (device: ${device})...`);
  console.log(`Prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? "..." : ""}`);

  let project: any;
  if (projectId) {
    project = stitch.project(projectId);
  } else {
    // Create a new project
    const result = await stitch.callTool("create_project", { title: `SA Design - ${timestamp()}` });
    console.log(`Created project: ${JSON.stringify(result)}`);
    // Extract project ID from the name field (format: "projects/<id>")
    const newId = result?.name?.split("/").pop();
    if (!newId) {
      console.error("Failed to extract project ID from:", result);
      process.exit(1);
    }
    project = stitch.project(newId);
    console.log(`Using project: ${newId}`);
  }

  const pid = projectId || (project.id as string);
  let screen: any;

  // Try project.generate() first, fall back to callTool
  try {
    screen = await project.generate(fullPrompt, device);
    console.log(`Screen generated (id: ${screen?.screenId || screen?.id || "unknown"})`);
  } catch (genErr: any) {
    console.log(`project.generate() failed (${genErr.message}), using callTool...`);
    const result = await stitch.callTool("generate_screen_from_text", {
      projectId: pid,
      prompt: fullPrompt,
      deviceType: device,
    });

    // Extract screen ID from callTool result
    const screenId = result?.outputComponents?.[0]?.screen?.name?.split("/screens/").pop()
      || result?.screen?.name?.split("/screens/").pop();

    if (screenId) {
      console.log(`Screen generated via callTool (id: ${screenId})`);
      // Fetch the screen object to download assets
      screen = { screenId, projectId: pid };
      const outDir = ensureOutputDir();
      const ts = timestamp();
      const label = flags.label || "generated";
      const prefix = `${label}_${ts}`;

      // Save the raw result for inspection
      writeFileSync(join(outDir, `${prefix}_raw.json`), JSON.stringify(result, null, 2));
      console.log(`  Raw result saved: ${join(outDir, `${prefix}_raw.json`)}`);

      // Try to get screen assets via the project
      try {
        const projScreens = await stitch.project(pid).screens();
        const found = projScreens.find((s: any) => s.screenId === screenId || s.id === screenId);
        if (found) {
          screen = found;
          console.log(`  Found screen in project, downloading assets...`);
        }
      } catch { /* continue with what we have */ }
    } else {
      // Save whatever we got
      const outDir = ensureOutputDir();
      const ts = timestamp();
      writeFileSync(join(outDir, `${flags.label || "generated"}_${ts}_raw.json`), JSON.stringify(result, null, 2));
      console.log(`Result saved as raw JSON. Could not extract screen ID.`);
      return;
    }
  }

  if (screen?.getHtml || screen?.getImage) {
    await saveScreenAssets(screen, flags.label || "generated");
  } else {
    // Try fetching screens from project to find and download
    try {
      const projScreens = await stitch.project(pid).screens();
      if (projScreens.length > 0) {
        const latest = projScreens[projScreens.length - 1];
        console.log(`Downloading latest screen from project...`);
        await saveScreenAssets(latest, flags.label || "generated");
      }
    } catch (e: any) {
      console.log(`Could not fetch screen assets: ${e.message}`);
    }
  }
  console.log("Done.");
}

async function handleEdit(stitch: any, flags: Record<string, string>) {
  const screenId = flags.screen;
  const prompt = flags.prompt;
  if (!screenId || !prompt) {
    console.error("Error: --screen and --prompt are required for edit.");
    process.exit(1);
  }

  const projectId = flags.project;
  if (!projectId) {
    console.error("Error: --project is required for edit.");
    process.exit(1);
  }

  console.log(`Editing screen ${screenId}...`);
  console.log(`Prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? "..." : ""}`);

  const project = stitch.project(projectId);
  const screens = await project.screens();
  const screen = screens.find((s: any) => s.id === screenId);
  if (!screen) {
    console.error(`Screen ${screenId} not found in project ${projectId}.`);
    process.exit(1);
  }

  const edited = await screen.edit(prompt);
  console.log(`Screen edited (id: ${edited.id || "unknown"})`);

  await saveScreenAssets(edited, flags.label || "edited");
  console.log("Done.");
}

async function handleVariants(stitch: any, flags: Record<string, string>) {
  const screenId = flags.screen;
  const prompt = flags.prompt;
  if (!screenId || !prompt) {
    console.error("Error: --screen and --prompt are required for variants.");
    process.exit(1);
  }

  const projectId = flags.project;
  if (!projectId) {
    console.error("Error: --project is required for variants.");
    process.exit(1);
  }

  const count = parseInt(flags.count || "3", 10);
  const range = flags.range || "EXPLORE";
  const aspects = flags.aspects ? flags.aspects.split(",") : ["LAYOUT", "COLOR_SCHEME"];

  console.log(`Generating ${count} variants (range: ${range}, aspects: ${aspects.join(", ")})...`);

  const project = stitch.project(projectId);
  const screens = await project.screens();
  const screen = screens.find((s: any) => s.id === screenId);
  if (!screen) {
    console.error(`Screen ${screenId} not found in project ${projectId}.`);
    process.exit(1);
  }

  const variants = await screen.variants(prompt, {
    variantCount: count,
    creativeRange: range,
    aspects,
  });

  console.log(`Generated ${variants.length} variants.`);
  for (let i = 0; i < variants.length; i++) {
    console.log(`\nVariant ${i + 1}:`);
    await saveScreenAssets(variants[i], `variant_${i + 1}`);
  }
  console.log("Done.");
}

async function handleListProjects(stitch: any) {
  console.log("Fetching projects...\n");
  const projects = await stitch.projects();
  if (projects.length === 0) {
    console.log("No projects found.");
    return;
  }
  for (const p of projects) {
    console.log(`  ${p.id}  ${p.title || "(untitled)"}`);
  }
  console.log(`\n${projects.length} project(s) found.`);
}

async function handleListScreens(stitch: any, flags: Record<string, string>) {
  const projectId = flags.project;
  if (!projectId) {
    console.error("Error: --project is required for list-screens.");
    process.exit(1);
  }

  console.log(`Fetching screens for project ${projectId}...\n`);
  const project = stitch.project(projectId);
  const screens = await project.screens();
  if (screens.length === 0) {
    console.log("No screens found.");
    return;
  }
  for (const s of screens) {
    console.log(`  ${s.id}  ${s.title || "(untitled)"}`);
  }
  console.log(`\n${screens.length} screen(s) found.`);
}

async function handleGetScreen(stitch: any, flags: Record<string, string>) {
  const screenId = flags.screen;
  if (!screenId) {
    console.error("Error: --screen is required for get.");
    process.exit(1);
  }

  const projectId = flags.project;
  if (!projectId) {
    console.error("Error: --project is required for get.");
    process.exit(1);
  }

  console.log(`Fetching screen ${screenId}...`);
  const project = stitch.project(projectId);
  const screens = await project.screens();
  const screen = screens.find((s: any) => s.id === screenId);
  if (!screen) {
    console.error(`Screen ${screenId} not found.`);
    process.exit(1);
  }

  await saveScreenAssets(screen, flags.label || `screen_${screenId}`);
  console.log("Done.");
}

function printHelp() {
  console.log(`
Stitch Design Generator - Sustainability Academy

Commands:
  generate        Generate a new screen from a text prompt
  edit            Edit an existing screen with a new prompt
  variants        Generate design variants of an existing screen
  list-projects   List all Stitch projects
  list-screens    List all screens in a project
  get             Download HTML + screenshot for a screen

Options (generate):
  --prompt TEXT        Design prompt (required)
  --device TYPE        DESKTOP | MOBILE | TABLET | AGNOSTIC (default: DESKTOP)
  --project ID         Use existing project (creates new if omitted)
  --design-system      Prepend Verdant Core DESIGN.md to the prompt
  --label NAME         Output file prefix (default: "generated")

Options (edit):
  --screen ID          Screen to edit (required)
  --project ID         Project containing the screen (required)
  --prompt TEXT        Edit instructions (required)
  --label NAME         Output file prefix (default: "edited")

Options (variants):
  --screen ID          Screen to create variants from (required)
  --project ID         Project containing the screen (required)
  --prompt TEXT        Variant prompt (required)
  --count N            Number of variants, 1-5 (default: 3)
  --range TYPE         REFINE | EXPLORE | REIMAGINE (default: EXPLORE)
  --aspects LIST       Comma-separated: LAYOUT,COLOR_SCHEME,IMAGES,TEXT_FONT,TEXT_CONTENT
  --label NAME         Output file prefix (default: "variant")

Examples:
  npx tsx scripts/stitch-generate.ts generate \\
    --prompt "A lesson page with left sidebar, 700px content area, breadcrumb, sticky audio player" \\
    --design-system --device DESKTOP

  npx tsx scripts/stitch-generate.ts edit \\
    --project abc123 --screen def456 \\
    --prompt "Make the sidebar collapsible and add a green progress bar"

  npx tsx scripts/stitch-generate.ts variants \\
    --project abc123 --screen def456 \\
    --prompt "Try different color schemes" \\
    --count 3 --range EXPLORE --aspects COLOR_SCHEME,LAYOUT

  npx tsx scripts/stitch-generate.ts list-projects
`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
