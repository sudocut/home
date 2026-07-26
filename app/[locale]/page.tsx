import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionButton } from "@/components/ActionButton";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/Section";
import { getPathname } from "@/i18n/navigation";

type LocaleParams = { locale: string };

const FIGURES = ["one", "two", "three"] as const;
const PRINCIPLES = ["one", "two", "three"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  return { title: meta("title"), description: meta("description") };
}

export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  // Resolved here rather than inside ActionButton so the component stays a
  // plain anchor that works for both internal routes and mailto:.
  const contactHref = getPathname({ href: "/contact", locale });

  return (
    <>
      <section className="mx-auto w-full max-w-[var(--sc-measure)] px-6 py-20 md:px-10 md:py-28">
        <span className="sc-label mb-6">{t("eyebrow")}</span>
        <h1 className="text-4xl md:text-6xl">{t("line")}</h1>
        <p className="mt-6 text-xl text-[color:var(--sc-content-muted)] md:text-2xl">{t("lede")}</p>
        <Prose className="mt-12">
          <p className="sc-numeric text-lg md:text-xl">{t("intro")}</p>
          <p>{t("body")}</p>
        </Prose>
      </section>

      <Section label={t("numbers.eyebrow")} title={t("numbers.title")}>
        <dl className="grid gap-12 md:grid-cols-3">
          {FIGURES.map((figure) => (
            <div key={figure}>
              <dt className="sc-numeric text-3xl md:text-4xl">{t(`numbers.${figure}.value`)}</dt>
              <dd className="mt-3 text-[color:var(--sc-content-muted)]">
                {t(`numbers.${figure}.label`)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="sc-label mt-12">{t("numbers.note")}</p>
      </Section>

      <Section title={t("principles.title")}>
        <ul className="grid gap-10 md:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <li key={principle} className="max-w-[38ch]">
              {t(`principles.${principle}`)}
            </li>
          ))}
        </ul>
      </Section>

      {/* The one cobalt object on this page. Do not add a second. */}
      <Section>
        <div className="flex flex-col items-start gap-6">
          <p className="sc-label">{t("cta.note")}</p>
          <ActionButton href={contactHref}>{t("cta.label")}</ActionButton>
        </div>
      </Section>
    </>
  );
}
