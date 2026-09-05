// Build-time sitemap generator — runs as a "prebuild" step (see the
// "build" script in package.json) BEFORE `vite build`, so the file it
// writes to public/sitemap.xml gets copied into dist/ like any other
// static public asset.
//
// No new dependency: only node:fs/node:path/node:url and the global
// fetch()/AbortSignal (both built into modern Node) are used, so this
// carries zero risk to Cloudflare's `npm clean-install` step, which
// requires package.json/package-lock.json to match exactly.
//
// Static routes are always included. Lineage pages are enumerated by
// calling the public GET /lineages API — this only ever returns
// already-approved public lineages, so no auth is needed. If that call
// fails for any reason (API down at build time, network hiccup, etc.)
// this falls back to just the static routes rather than failing the
// build — a slightly stale/incomplete sitemap is far better than a
// broken deploy.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = (process.env.VITE_SITE_URL || "https://agburu.pages.dev").replace(/\/+$/, "");
const API_BASE = (process.env.VITE_API_BASE || "https://agburu.onrender.com/api").replace(/\/+$/, "");

const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/create-lineage", changefreq: "monthly", priority: "0.5" },
];

async function fetchLineageSlugs() {
  try {
    const response = await fetch(`${API_BASE}/lineages`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const lineages = await response.json();
    if (!Array.isArray(lineages)) throw new Error("Unexpected /lineages response shape");
    return lineages.map((lineage) => lineage.slug).filter(Boolean);
  } catch (error) {
    console.warn(
      `[generate-sitemap] Could not fetch lineages from ${API_BASE}/lineages (${error.message}). ` +
        "Falling back to static routes only — this will NOT fail the build.",
    );
    return [];
  }
}

function buildXml(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = urls
    .map(
      ({ loc, changefreq, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  const lineageSlugs = await fetchLineageSlugs();

  const urls = [
    ...STATIC_ROUTES.map((route) => ({
      loc: `${SITE_URL}${route.path}`,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
    ...lineageSlugs.map((slug) => ({
      loc: `${SITE_URL}/${slug}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const xml = buildXml(urls);
  const outPath = resolve(__dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf8");
  console.log(`[generate-sitemap] Wrote ${urls.length} URL(s) to ${outPath}`);
}

main();
