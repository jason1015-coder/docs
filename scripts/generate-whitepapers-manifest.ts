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
 *
 * As a side-effect, this script also fetches the open + closed issue counts
 * for each whitepaper (matched by the `Feedback for "<title>"` title
 * prefix) and embeds them in the manifest so the docs UI can render the
 * counts as static HTML. The counts are populated by the daily 00:15 UTC
 * deploy workflow, which has GITHUB_TOKEN injected.
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

// Repo where whitepaper feedback issues live. Matched by title prefix
// `Feedback for "<page title>"` to stay consistent with Nextra's default
// feedback link and the new-issue link in the whitepaper header widget.
const FEEDBACK_REPO_OWNER = "Nano-Collective";
const FEEDBACK_REPO_NAME = "docs";

interface WhitepaperIssueCounts {
  open: number;
  closed: number;
  total: number;
}

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
  issue_counts?: WhitepaperIssueCounts;
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

function buildManifestBase(): WhitepaperManifestEntry[] {
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

/**
 * Fetch open + closed issue counts for a whitepaper from GitHub, matching
 * issues whose title contains the `Feedback for "<title>"` phrase. The
 * docs UI uses the same phrase in its new-issue link, so issues opened
 * from anywhere in the docs flow into this count.
 *
 * Requires a GITHUB_TOKEN with public-repo read access. The daily
 * deploy workflow (`.github/workflows/deploy.yaml`) injects
 * `secrets.GITHUB_TOKEN` for us. In local dev with no token, the
 * function bails and `issue_counts` is simply omitted from the entry.
 */
async function fetchIssueCounts(
  title: string,
): Promise<WhitepaperIssueCounts | undefined> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn(
      "GITHUB_TOKEN not set — skipping issue count fetch. Counts will be missing from the manifest.",
    );
    return undefined;
  }

  // Match the same query the client component would use: scoped to the
  // title field, this repo, and the exact phrase `Feedback for "<title>"`.
  // The state qualifier (`is:open` / `is:closed`) is part of the `q` value
  // because search qualifiers in GitHub's API are not separate parameters —
  // they must be appended with a space (encoded as `+` by URLSearchParams).
  // NOTE: state must be built per call, so we can't share the URL.
  const phrase = `Feedback for \u201C${title}\u201D`;
  const buildUrl = (state: "open" | "closed"): string => {
    const params = new URLSearchParams();
    params.set(
      "q",
      `repo:${FEEDBACK_REPO_OWNER}/${FEEDBACK_REPO_NAME} is:issue in:title "${phrase}" is:${state}`,
    );
    params.set("per_page", "1");
    return `https://api.github.com/search/issues?${params.toString()}`;
  };

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "nano-collective-docs-manifest",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    const [openRes, closedRes] = await Promise.all([
      fetch(buildUrl("open"), { headers, cache: "no-store" }),
      fetch(buildUrl("closed"), { headers, cache: "no-store" }),
    ]);

    if (!openRes.ok || !closedRes.ok) {
      console.warn(
        `Issue count fetch for "${title}" failed (open=${openRes.status}, closed=${closedRes.status}) — skipping.`,
      );
      return undefined;
    }

    const [openJson, closedJson] = (await Promise.all([
      openRes.json(),
      closedRes.json(),
    ])) as Array<{ total_count?: number }>;

    const open = openJson.total_count ?? 0;
    const closed = closedJson.total_count ?? 0;
    return { open, closed, total: open + closed };
  } catch (err) {
    console.warn(
      `Issue count fetch for "${title}" threw: ${err instanceof Error ? err.message : String(err)} — skipping.`,
    );
    return undefined;
  }
}

async function main(): Promise<void> {
  const manifest = buildManifestBase();

  // Fetch issue counts sequentially to be polite to the rate limit. The
  // search API is shared across all label-scoped queries (30 req/min
  // authenticated) so parallelism isn't worth the risk of bursting.
  for (const entry of manifest) {
    const counts = await fetchIssueCounts(entry.title);
    if (counts) {
      entry.issue_counts = counts;
    }
  }

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
