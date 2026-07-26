import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionButton } from "@/components/ActionButton";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/Section";

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: meta("titleTemplate", { page: t("eyebrow") }),
    description: t("body"),
  };
}

export default async function ContactPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const email = t("email");

  return (
    <>
      <section className="mx-auto w-full max-w-[var(--sc-measure)] px-6 py-20 md:px-10 md:py-28">
        <span className="sc-label mb-6">{t("eyebrow")}</span>
        <h1 className="text-4xl md:text-5xl">{t("title")}</h1>
        <p className="mt-6 text-xl text-[color:var(--sc-content-muted)]">{t("lede")}</p>
      </section>

      <Section>
        <Prose>
          <p>{t("body")}</p>
        </Prose>

        <dl className="mt-12">
          <dt className="sc-label">{t("emailLabel")}</dt>
          <dd className="sc-numeric mt-3 text-2xl md:text-3xl">
            <a href={`mailto:${email}`}>{email}</a>
          </dd>
        </dl>

        {/* The one cobalt object on this page. The address above is the same
            link in monochrome — a second cobalt button would be a bug. */}
        <div className="mt-12 flex flex-col items-start gap-6">
          <ActionButton href={`mailto:${email}`}>{t("cta.label")}</ActionButton>
          <p className="sc-label">{t("note")}</p>
        </div>
      </Section>
    </>
  );
}
