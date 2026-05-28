/**
 * Generates a manifest of all whitepapers from their frontmatter and writes
 * it to public/whitepapers.json. The manifest gets deployed as a static
 * asset at https://docs.nanocollective.org/whitepapers.json and is consumed
 * by the website at build time (see website/lib/whitepapers.ts).
 *
 * Run as part of `prebuild` so every docs deploy ships a fresh manifest,
 * and via the dedicated `whitepapers-manifest` GitHub Action so the file in
 * source control stays in sync with the whitepaper frontmatter.
 *
 * Source of truth is the frontmatter in
 * content/collective/whitepapers/<slug>.md.
 */

import fs from "node:fs";
import path from "node:path";

const WHITEPAPERS_DIR = path.join(
  process.cwd(),
  "content",
  "collective",
  "whitepapers",
);

const OUT_PATH = path.join(process.cwd(), "public", "whitepapers.json");

interface WhitepaperManifestEntry {
  slug: string;
  title: string;
  description: string;
  proposer?: string;
  proposer_github?: string;
  status?: string;
  review_opens?: string;
  review_closes?: string;
  sidebar_order?: number;
}

function unquote(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(raw: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return out;
  const body = match[1];
  for (const line of body.split("\n")) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (!m) continue;
    const key = m[1];
    const value = unquote(m[2]);
    if (/^-?\d+$/.test(value)) {
      out[key] = parseInt(value, 10);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function buildManifest(): WhitepaperManifestEntry[] {
  if (!fs.existsSync(WHITEPAPERS_DIR)) {
    console.warn(`Whitepapers directory not found: ${WHITEPAPERS_DIR}`);
    return [];
  }

  const entries: WhitepaperManifestEntry[] = [];

  for (const file of fs.readdirSync(WHITEPAPERS_DIR)) {
    if (!file.endsWith(".md")) continue;
    if (file === "index.md") continue;

    const slug = file.replace(/\.md$/, "");
    const fullPath = path.join(WHITEPAPERS_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const fm = parseFrontmatter(raw);

    if (!fm.title) {
      console.warn(`Skipping ${file}: no title in frontmatter`);
      continue;
    }

    entries.push({
      slug,
      title: String(fm.title),
      description: String(fm.description ?? ""),
      proposer: fm.proposer ? String(fm.proposer) : undefined,
      proposer_github: fm.proposer_github
        ? String(fm.proposer_github)
        : undefined,
      status: fm.status ? String(fm.status) : undefined,
      review_opens: fm.review_opens ? String(fm.review_opens) : undefined,
      review_closes: fm.review_closes ? String(fm.review_closes) : undefined,
      sidebar_order:
        typeof fm.sidebar_order === "number" ? fm.sidebar_order : undefined,
    });
  }

  entries.sort((a, b) => {
    const ao = a.sidebar_order ?? Number.POSITIVE_INFINITY;
    const bo = b.sidebar_order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.slug.localeCompare(b.slug);
  });

  return entries;
}

function main(): void {
  const manifest = buildManifest();

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const payload = {
    generated_at: new Date().toISOString(),
    count: manifest.length,
    whitepapers: manifest,
  };
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(
    `Wrote ${manifest.length} whitepapers to ${path.relative(process.cwd(), OUT_PATH)}`,
  );
}

main();
