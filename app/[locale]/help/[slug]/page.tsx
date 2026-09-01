import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocBody } from "@/components/Markdown";
import { docSlugs, getDoc, isIsoDate } from "@/content/docs";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

type DocParams = { locale: string; slug: string };

// The slug set is a union across locales (src/content/docs.ts), so every
// document is prerendered in every locale and /ko/help/<en-only-slug> is a real
// page rather than a 404. Paired with dynamicParams = false, an unknown slug is
// a router-level 404 and the whole route stays static.
export function generateStaticParams(): { slug: string }[] {
  return docSlugs("help").map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<DocParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const doc = getDoc("help", isLocale(locale) ? locale : DEFAULT_LOCALE, slug);
  if (!doc) return {};
  const meta = await getTranslations({ locale, namespace: "meta" });
  return {
    title: meta("titleTemplate", { page: doc.title }),
    ...(doc.summary ? { description: doc.summary } : {}),
  };
}

/**
 * /help/[slug] — one markdown file, rendered.
 *
 * The document is the source of truth. Its title, summary and date come from the
 * file's frontmatter, not from messages/; only the chrome around it is
 * translated. That is the whole point of the route: to publish a customer-facing
 * document you write a .md file and commit it.
 *
 * NO cobalt. A help page has nothing to press.
 */
export default async function DocPage({ params }: { params: Promise<DocParams> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const requested = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const doc = getDoc("help", requested, slug);
  if (!doc) notFound();

  const t = await getTranslations("help");
  const nav = await getTranslations("nav");

  return (
    <div className="sc-wrap">
      <section className="sc-page-head">
        <p className="sc-kicker">
          <Link href="/help">{nav("help")}</Link>
        </p>
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
          serve it, rather than 404 a link a customer was already sent. */}
      {doc.locale !== requested ? (
        <p className="sc-doc-note">{t("fallback", { language: nav(`language.${doc.locale}`) })}</p>
      ) : null}

      <article className="sc-doc">
        <DocBody>{doc.body}</DocBody>
      </article>

      <p className="sc-more">
        <Link href="/help">{t("back")}</Link>
      </p>
    </div>
  );
}
