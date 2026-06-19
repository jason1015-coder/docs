import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { getWhitepaperIssueCounts } from "@/lib/whitepapers";
import { useMDXComponents } from "../../../mdx-components";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

const CONTENT_ROOT = path.join(process.cwd(), "content", "collective");

function getCollectiveContent(
  slugParts: string[],
): { content: string; relPath: string } | null {
  const base = slugParts.join("/");
  const candidates = [
    `${base}.mdx`,
    `${base}.md`,
    `${base}/index.mdx`,
    `${base}/index.md`,
  ];

  for (const rel of candidates) {
    const abs = path.join(CONTENT_ROOT, rel);
    if (fs.existsSync(abs)) {
      return { content: fs.readFileSync(abs, "utf-8"), relPath: rel };
    }
  }
  return null;
}

function collectSlugs(dir: string, prefix: string[] = []): string[][] {
  if (!fs.existsSync(dir)) return [];
  const out: string[][] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(
        ...collectSlugs(path.join(dir, entry.name), [...prefix, entry.name]),
      );
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md") && !entry.name.endsWith(".mdx")) continue;

    const slug = entry.name.replace(/\.(mdx|md)$/, "");

    if (slug === "index") {
      // Top-level index is handled by /collective/page.tsx — skip it here.
      // Subfolder index files are routable as their folder slug (e.g. /collective/projects).
      if (prefix.length > 0) out.push([...prefix]);
      continue;
    }

    out.push([...prefix, slug]);
  }
  return out;
}

export async function generateStaticParams() {
  return collectSlugs(CONTENT_ROOT).map((slug) => ({ slug }));
}

async function CompiledCollectiveSlugContent({ slug, found }: { slug: string[]; found: { content: string; relPath: string } }) {
  const components = useMDXComponents({});
  const compiledSource = await compileMdx(found.content, {
    filePath: `content/collective/${found.relPath}`,
    defaultShowCopyCode: true,
    codeHighlight: true,
  });

  const {
    default: MDXContent,
    toc,
    metadata: mdxMetadata,
  } = evaluate(compiledSource, components);

  const { CollectiveWrapper } = await import("@/components/CollectiveWrapper");

  const isWhitepaperPage = slug[0] === "whitepapers" && slug.length >= 2;
  const issueCounts = isWhitepaperPage
    ? getWhitepaperIssueCounts(slug[slug.length - 1])
    : undefined;

  return (
    <CollectiveWrapper
      toc={toc}
      metadata={mdxMetadata || {}}
      pageSlug={slug.join("/")}
      issueCounts={issueCounts}
      sourceCode={found.content}
    >
      <MDXContent />
    </CollectiveWrapper>
  );
}

export default async function CollectivePage({ params }: PageProps) {
  const { slug } = await params;

  const found = getCollectiveContent(slug);
  if (!found) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-12 text-center opacity-50 font-mono text-sm uppercase tracking-widest">[ COMPILING_MDX... ]</div>}>
      <CompiledCollectiveSlugContent slug={slug} found={found} />
    </Suspense>
  );
}
