import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionButton } from "@/components/ActionButton";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/Section";
import { getPathname } from "@/i18n/navigation";

type LocaleParams = { locale: string };

const BODY = ["one", "two", "three"] as const;
const PRINCIPLES = ["one", "two", "three", "four"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: meta("titleTemplate", { page: t("eyebrow") }),
    description: t("lede"),
  };
}

export default async function AboutPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const contactHref = getPathname({ href: "/contact", locale });

  return (
    <>
      <section className="mx-auto w-full max-w-[var(--sc-measure)] px-6 py-20 md:px-10 md:py-28">
        <span className="sc-label mb-6">{t("eyebrow")}</span>
        <h1 className="text-4xl md:text-5xl">{t("title")}</h1>
        <p className="mt-6 max-w-[46ch] text-xl text-[color:var(--sc-content-muted)]">
          {t("lede")}
        </p>
      </section>

      <Section>
        <Prose>
          {BODY.map((paragraph) => (
            <p key={paragraph}>{t(`body.${paragraph}`)}</p>
          ))}
        </Prose>
      </Section>

      <Section title={t("principles.title")}>
        <ul className="grid gap-8 md:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <li key={principle} className="max-w-[44ch]">
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
