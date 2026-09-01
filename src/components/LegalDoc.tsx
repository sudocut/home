import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DocBody } from "@/components/Markdown";
import { getDoc, isIsoDate } from "@/content/docs";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

/**
 * The two legal documents, rendered. /terms and /privacy are separate routes
 * rather than /help/<slug> because their URLs are quoted outside this codebase —
 * the Google OAuth consent screen carries both as "Application terms of service
 * link" and "Application privacy policy link" — and a link that a third party
 * has recorded may not move when the help library is reorganised.
 *
 * Same shape as a help document otherwise: the markdown file is the source, the
 * chrome around it is translated. No index page, so the kicker is plain text
 * rather than a link back to a list that does not exist.
 *
 * NO cobalt. A legal page has nothing to press.
 */

export type LegalSlug = "terms" | "privacy";

const OTHER: Record<LegalSlug, { slug: LegalSlug; href: "/terms" | "/privacy" }> = {
  terms: { slug: "privacy", href: "/privacy" },
  privacy: { slug: "terms", href: "/terms" },
};

/** Shared with each route's generateMetadata — the title comes from the file. */
export async function legalMetadata(locale: string, slug: LegalSlug): Promise<Metadata> {
  const doc = getDoc("legal", isLocale(locale) ? locale : DEFAULT_LOCALE, slug);
  if (!doc) return {};
  const meta = await getTranslations({ locale, namespace: "meta" });
  return {
    title: meta("titleTemplate", { page: doc.title }),
    ...(doc.summary ? { description: doc.summary } : {}),
  };
}

export async function LegalDoc({ locale, slug }: { locale: string; slug: LegalSlug }) {
  const requested = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const doc = getDoc("legal", requested, slug);
  // Unreachable while both files exist in content/legal/en/. If one is ever
  // deleted, a 404 is the honest answer — better than a legal page that renders
  // its own title over an empty body.
  if (!doc) notFound();

  const t = await getTranslations("legal");
  const nav = await getTranslations("nav");
  const other = OTHER[slug];

  return (
    <div className="sc-wrap">
      <section className="sc-page-head">
        <p className="sc-kicker">{t("kicker")}</p>
        <h1>{doc.title}</h1>
        {doc.updated ? (
          <p className="sc-doc-meta">
            {t("updated")}{" "}
            {isIsoDate(doc.updated) ? (
              <time className="sc-numeric" dateTime={doc.updated}>
                {doc.updated}
              </time>
            ) : (
              <span className="sc-numeric">{doc.updated}</span>
            )}
          </p>
        ) : null}
      </section>

      {/* The translation is late, not missing — say which language this is and
          serve it, rather than 404 a link that is printed on a consent screen. */}
      {doc.locale !== requested ? (
        <p className="sc-doc-note">{t("fallback", { language: nav(`language.${doc.locale}`) })}</p>
      ) : null}

      <article className="sc-doc">
        <DocBody>{doc.body}</DocBody>
      </article>

      <p className="sc-more">
        <Link href={other.href}>{nav(other.slug)} →</Link>
      </p>
    </div>
  );
}
