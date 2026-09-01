import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";

/**
 * The markdown document collections. The files in `content/<collection>/<locale>/`
 * ARE the source documents — this module only locates and parses them. Nothing is
 * duplicated into `messages/`; the page chrome is translated there, the document
 * body is not, because a document is written once in the language it is written
 * in. See `content/help/README.md` for the authoring contract.
 *
 * Server-only: it reads the filesystem. Every route that uses it is statically
 * prerendered, so the reads happen at build time and never on a request — but
 * `content/**` is traced in next.config.ts anyway so a future dynamic route
 * cannot 500 on a missing file.
 *
 * Two collections, and the difference is the route rather than the parser:
 * `help` is an indexed library at /help/<slug>, `legal` is a fixed pair of
 * documents at /terms and /privacy. Legal pages get their own directory and their
 * own URLs because a terms-of-service link is quoted in places we do not control
 * — an OAuth consent screen, an app store form — and must not move when the help
 * library is reorganised.
 */

export type Collection = "help" | "legal";

const ROOT = join(process.cwd(), "content");

export type DocMeta = {
  slug: string;
  title: string;
  summary: string;
  order: number;
  updated: string;
  /**
   * The locale whose file actually supplied the text. Equal to the requested
   * locale in the normal case; different when a translation does not exist yet,
   * which is what the page's fallback notice is keyed on.
   */
  locale: Locale;
};

export type Doc = DocMeta & { body: string };

/**
 * A deliberate subset of YAML: one `key: value` per line, optional surrounding
 * quotes, no nesting and no lists. Frontmatter here carries four scalars, and a
 * real YAML parser would be a dependency bought to solve a problem we do not
 * have. Anything richer than this belongs in the body.
 */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  const block = match?.[1];
  if (!match || block === undefined) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    if (!key || key.startsWith("#")) continue;
    const value = line.slice(colon + 1).trim();
    data[key] = value.replace(/^["'](.*)["']$/, "$1");
  }

  return { data, body: raw.slice(match[0].length) };
}

function readDoc(collection: Collection, locale: Locale, slug: string): Doc | null {
  let raw: string;
  try {
    raw = readFileSync(join(ROOT, collection, locale, `${slug}.md`), "utf8");
  } catch {
    return null;
  }

  const { data, body } = parseFrontmatter(raw);
  const order = Number.parseInt(data.order ?? "", 10);

  return {
    slug,
    // A file with no title is still a page rather than a build error — the slug
    // is a worse heading than a real title, and a visibly worse one, which is
    // the correct amount of pressure to go and write the frontmatter.
    title: data.title || slug,
    summary: data.summary ?? "",
    order: Number.isNaN(order) ? Number.MAX_SAFE_INTEGER : order,
    updated: data.updated ?? "",
    locale,
    body: body.trim(),
  };
}

function slugsIn(collection: Collection, locale: Locale): string[] {
  try {
    return readdirSync(join(ROOT, collection, locale))
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -3));
  } catch {
    return [];
  }
}

/**
 * Every slug published in any locale. The set is a union, not the default
 * locale's directory, so a document that only exists in Korean is still reachable
 * from the English index rather than silently unpublished.
 */
export function docSlugs(collection: Collection): string[] {
  return [...new Set(LOCALES.flatMap((locale) => slugsIn(collection, locale)))].sort();
}

/**
 * The requested locale's file, or the closest one that exists. Resolution order
 * is: the requested locale, then the default locale, then any remaining locale.
 * A shared link therefore never 404s because a translation is late — the page
 * serves what it has and says which language it is in.
 */
export function getDoc(collection: Collection, locale: Locale, slug: string): Doc | null {
  const order: Locale[] = [locale, DEFAULT_LOCALE, ...LOCALES];
  for (const candidate of order) {
    const doc = readDoc(collection, candidate, slug);
    if (doc) return doc;
  }
  return null;
}

/**
 * True when `updated` is the `YYYY-MM-DD` the README asks for. A <time> element
 * is only valid HTML if its text (or its dateTime) is a machine-readable date,
 * so anything else is rendered as plain text rather than as a broken <time>.
 * Frontmatter is hand-written; this is the one place that has to survive a typo.
 */
export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** The index, sorted by `order` then title. Bodies are not loaded into the list. */
export function listDocs(collection: Collection, locale: Locale): DocMeta[] {
  return docSlugs(collection)
    .map((slug) => getDoc(collection, locale, slug))
    .filter((doc): doc is Doc => doc !== null)
    .map(({ body: _body, ...meta }) => meta)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
