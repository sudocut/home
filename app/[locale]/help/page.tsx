import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isIsoDate, listDocs } from "@/content/docs";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: meta("titleTemplate", { page: t("help") }) };
}

/**
 * /help — the index of the help library. One hairline-ruled row per document, in
 * the vocabulary the pricing page already uses; no new visual language, because
 * adding a page is not a licence to run an unranked round.
 *
 * NO cobalt. Every row here is a link, so there is no single required action for
 * the point colour to mark — promoting one would be the "two cobalt objects"
 * bug by another route.
 *
 * The list is whatever is in content/help/. There is no curation step and no
 * feature flag: a committed file is a published document.
 */
export default async function HelpPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  const docs = listDocs(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return (
    <div className="sc-wrap">
      <section className="sc-page-head">
        <p className="sc-kicker">{t("kicker")}</p>
        <h1>{t("title")}</h1>
        <p className="sc-lede">{t("lede")}</p>
      </section>

      {docs.length === 0 ? (
        // Honesty over polish: an empty library says it is empty. It does not
        // borrow a "coming soon" that nobody has promised.
        <p className="sc-foot-note">{t("empty")}</p>
      ) : (
        <ul aria-label={t("listLabel")} className="sc-doc-list">
          {docs.map((doc) => (
            <li key={doc.slug}>
              <Link href={`/help/${doc.slug}`}>{doc.title}</Link>
              {doc.summary ? <p className="sc-doc-summary">{doc.summary}</p> : null}
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
            </li>
          ))}
        </ul>
      )}

      <p className="sc-foot-note">{t("footNote")}</p>
    </div>
  );
}
