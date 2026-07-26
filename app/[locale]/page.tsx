import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WaitlistCta } from "@/components/WaitlistCta";

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  return { title: meta("title"), description: meta("description") };
}

/**
 * Front page — r4 winner (kimi-k3-a), ranked blind and selected by the founder
 * on 2026-07-27. See design/rounds/r4/VERDICT.md.
 *
 * The hero deliberately does NOT claim the viewport: no 100svh, items aligned to
 * the top, so the 80/20 band arrives while the visitor is still reading. Both
 * variants that pinned a full-height hero placed below this one.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <div className="sc-wrap">
        <section className="sc-hero">
          <div>
            <p className="sc-kicker">{t("kicker")}</p>
            <h1>{t("title")}</h1>
            <p className="sc-lede">{t("lede")}</p>
            {/* The one cobalt object on this page. */}
            <WaitlistCta />
          </div>

          <aside aria-label={t("proof.label")} className="sc-proof">
            <p className="sc-proof-ab">{t("proof.mark")}</p>
            <p className="sc-proof-claim">{t("proof.claim")}</p>
            <p className="sc-proof-detail">{t("proof.detail")}</p>
            <p className="sc-proof-tagline">{t("proof.tagline")}</p>
          </aside>
        </section>
      </div>

      <section aria-label={t("split.label")} className="sc-split">
        {(["chore", "story"] as const).map((cell) => (
          <div className="sc-split-cell" key={cell}>
            <p className="sc-num">{t(`split.${cell}.value`)}</p>
            <p className="sc-split-label">{t(`split.${cell}.label`)}</p>
            <p className="sc-split-copy">{t(`split.${cell}.copy`)}</p>
          </div>
        ))}
      </section>

      <div className="sc-wrap">
        {/* Labelled an illustration, not a promise. soul.md: a demo that looks
            more capable than the live product breaks trust. */}
        <p className="sc-example">
          {t("example.before")}
          <span className="sc-numeric">{t("example.figure")}</span>
          {t("example.after")}
        </p>
      </div>
    </>
  );
}
