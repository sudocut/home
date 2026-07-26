import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/Section";

type LocaleParams = { locale: string };

const BODY = ["one", "two"] as const;
const PRINCIPLES = ["one", "two", "three", "four"] as const;

/**
 * Message-key ids for the roster, in display order. Empty on purpose — see the
 * STUB block below. Typed as `readonly string[]` rather than `as const` so that
 * filling it in is a one-line edit and the length check below stays honest.
 */
const MEMBERS: readonly string[] = [];

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "team" });
  return {
    title: meta("titleTemplate", { page: t("eyebrow") }),
    description: t("lede"),
  };
}

export default async function TeamPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("team");

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

      <Section title={t("roster.title")}>
        {/* STUB — the roster is not published. This grid is the finished slot; the
            data is what's missing.

            The founder supplies, per person:
              - name   (proper noun; write it in each language — "Jong Hyun Park"
                        in messages/en.json, "박종현" in messages/ko.json)
              - role   (one or two words; renders as the .sc-label above the line)
              - line   (ONE sentence, editor-to-editor, no adjectives — BRAND-KIT §12)
              - photo  (optional, and NOT wired up: adding one is a design-round
                        question, not a copy edit. Ask before shipping images.)

            Where it goes:
              1. messages/en.json + messages/ko.json → "team": { "members": {
                   "<id>": { "name": ..., "role": ..., "line": ... } } }
              2. MEMBERS above → ["<id>", ...] in display order.
            Nothing else changes; the branch below already renders it.

            Candidate source, NOT usable as-is: sudocut/meta
            business/fundraising/yc-fall-2026-application-final.md § Founders lists
            two people. That doc is a draft whose own header marks unconfirmed
            fields with ⬜, and one of the two titles is inside such a marker. It
            also carries birth years and personal links. Publishing any of it is a
            founder decision about people's names, not a copy task — so this page
            ships empty rather than guessing. */}
        {MEMBERS.length > 0 ? (
          <ul className="grid gap-10 md:grid-cols-3">
            {MEMBERS.map((id) => (
              <li key={id} className="max-w-[38ch]">
                <p className="text-lg">{t(`members.${id}.name`)}</p>
                <p className="sc-label mt-2">{t(`members.${id}.role`)}</p>
                <p className="mt-3 text-[color:var(--sc-content-muted)]">
                  {t(`members.${id}.line`)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="max-w-[46ch] border border-[color:var(--sc-rule)] p-8">
            <p className="sc-label">{t("roster.empty.label")}</p>
            <p className="mt-4 text-[color:var(--sc-content-muted)]">{t("roster.empty.body")}</p>
          </div>
        )}
      </Section>

      {/* No cobalt on this page, and no ActionButton. --sc-action marks the single
          REQUIRED action; a page that only reports what isn't published yet has
          none, and "Talk to us" here would be a button invented to justify the
          colour. Contact is already in the nav and the footer. */}
      <Section title={t("principles.title")}>
        <ul className="grid gap-8 md:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <li key={principle} className="max-w-[44ch]">
              {t(`principles.${principle}`)}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
