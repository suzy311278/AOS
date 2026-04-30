import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Resolves a doc_title from a citation to a streamable PDF URL.
//
// Citations look like: "VM0042v2.2", "Verra VCS Standard v4.7", etc.
// We map these to actual files under src/content/<course>/sources/<file>.pdf
// using the Docling catalog at data/page-indexes-docling-test/catalog.json
//
// GET /api/pdfs/resolve?doc=VM0042v2.2
//   -> { url: "/api/pdfs/vm0042/VM0042v2.2.pdf", page: 1, available: true }
// ---------------------------------------------------------------------------

interface CatalogDoc {
  id: string;
  file: string;
  title: string;
  course: string;
  total_pages: number;
}

const CATALOG_PATH = path.join(
  process.cwd(),
  "data/page-indexes-docling-test/catalog.json"
);

// Cloudflare R2 public URL for the greentryst-pdfs bucket.
// Set PDF_R2_BASE_URL in .env.local to override (for staging/prod).
const PDF_R2_BASE =
  process.env.PDF_R2_BASE_URL || "https://pub-4cc1b87074b84e1c8f4bdb7e6a646c27.r2.dev";

let CATALOG_CACHE: CatalogDoc[] | null = null;

function loadCatalog(): CatalogDoc[] {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  if (!fs.existsSync(CATALOG_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
  CATALOG_CACHE = raw.documents || [];
  return CATALOG_CACHE!;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Find catalog entry matching doc_title; tolerant of formatting differences. */
function findDoc(docTitle: string): CatalogDoc | null {
  const catalog = loadCatalog();
  const target = normalize(docTitle);

  // Exact title match first
  const exact = catalog.find((d) => normalize(d.title) === target);
  if (exact) return exact;

  // Substring match (citation may be truncated)
  const sub = catalog.find(
    (d) => normalize(d.title).includes(target) || target.includes(normalize(d.title))
  );
  if (sub) return sub;

  // Try matching the file stem
  const byFile = catalog.find((d) => normalize(d.file.split("/").pop()!.replace(".json", "")) === target);
  if (byFile) return byFile;

  return null;
}

/**
 * Resolve the PDF filename for a catalog entry.
 *
 * On Vercel the raw source PDFs are not in the deploy (gitignored under
 * src/content/**\/sources). They live exclusively in the greentryst-pdfs
 * R2 bucket, uploaded with filenames matching the catalog stem + ".pdf".
 *
 * So the authoritative mapping is catalog stem → R2 filename. No disk
 * check. In local dev, if the matching PDF is present under
 * src/content/<course>/sources/, we still prefer it as a fallback via
 * the exact-or-fuzzy resolver below. In prod we skip this entirely.
 */
function resolvePdfFilename(doc: CatalogDoc): string {
  const stem = doc.file.split("/").pop()!.replace(".json", "");
  return `${stem}.pdf`;
}

/**
 * Dev-only: locate the PDF on disk for the /api/pdfs/[course]/[filename]
 * fallback URL. Returns null in any deploy where the sources dir is not
 * present (the typical Vercel case).
 */
function findLocalPdfFilename(doc: CatalogDoc): string | null {
  const stem = doc.file.split("/").pop()!.replace(".json", "");
  const sourcesDir = path.join(process.cwd(), "src/content", doc.course, "sources");
  if (!fs.existsSync(sourcesDir)) return null;

  const direct = `${stem}.pdf`;
  if (fs.existsSync(path.join(sourcesDir, direct))) return direct;

  const files = fs.readdirSync(sourcesDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const targetStem = normalize(stem);
  const fuzzy = files.find((f) => normalize(f.replace(/\.pdf$/i, "")) === targetStem);
  if (fuzzy) return fuzzy;

  const contains = files.find((f) => {
    const fn = normalize(f.replace(/\.pdf$/i, ""));
    return fn.includes(targetStem) || targetStem.includes(fn);
  });
  return contains ?? null;
}

export async function GET(req: NextRequest) {
  const docTitle = req.nextUrl.searchParams.get("doc");
  const pageRaw = req.nextUrl.searchParams.get("page") || "1";

  if (!docTitle) {
    return Response.json({ error: "doc parameter is required" }, { status: 400 });
  }

  const doc = findDoc(docTitle);
  if (!doc) {
    return Response.json({
      available: false,
      reason: "no_catalog_match",
      query: docTitle,
    });
  }

  // Parse page (handle "14-15" -> 14, "14‑17" en-dash -> 14)
  const firstPageMatch = pageRaw.match(/(\d+)/);
  const page = firstPageMatch ? parseInt(firstPageMatch[1], 10) : 1;

  // Primary: the R2 public URL. Source PDFs live exclusively in the
  // greentryst-pdfs bucket in prod (no raw PDFs ship with the Vercel
  // deploy); filenames match `<catalog-stem>.pdf`.
  const filename = resolvePdfFilename(doc);
  const r2Url = `${PDF_R2_BASE}/${doc.course}/${encodeURIComponent(filename)}`;

  // Dev-only fallback: when running locally, the /api/pdfs/[course]/[filename]
  // handler streams straight from src/content/<course>/sources/. In prod this
  // route returns 404 (PDFs are not deployed), so we only emit the fallback
  // URL if a local file is actually present.
  const localFilename = findLocalPdfFilename(doc);
  const localUrl = localFilename
    ? `/api/pdfs/${doc.course}/${encodeURIComponent(localFilename)}`
    : null;

  return Response.json({
    available: true,
    url: r2Url,
    fallback_url: localUrl,
    page,
    doc_title: doc.title,
    course: doc.course,
    total_pages: doc.total_pages,
  });
}
