import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionButton } from "@/components/ActionButton";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/Section";
import { getPathname } from "@/i18n/navigation";

type LocaleParams = { locale: string };

const BODY = ["one", "two"] as const;
const BETA = ["access", "grant", "subscription", "topups"] as const;
const TIERS = ["free", "starter", "pro", "studio", "managed"] as const;
const NOTES = ["one", "two", "three"] as const;

/*
 * The numbers on this page are published on purpose, and the authority is
 * sudocut/meta business/pricing.md §3 Phase 0 (rev. 2026-07-22, which supersedes
 * the same-day "paid from day one" call):
 *
 *   "The launch price card is still shown in every pitch (₩49,000 tool /
 *    ₩299,000 Managed) and the reaction logged — we keep the pricing
 *    conversation without the charge, and beta channels know what launch will
 *    cost."
 *
 * The guard there is "without the charge", not "without the numbers". So both
 * cards are printed and the *charge* is what's absent: beta figures from that
 * same Phase 0 block, tiers from §3 Phase 1. Nothing is rounded, restated or
 * inferred — if a figure moves in that doc, move it here.
 *
 * Two things in the source deliberately NOT copied across:
 *   - The (~$36)-style USD column. Those are internal conversions at a fixed
 *     1 USD = 1,350 KRW; printing them would invent a US price card nobody has
 *     decided. ₩ only — launch.notes.three says so out loud.
 *   - Margin and unit-economics columns. Internal.
 *
 * Phase 1 is a TARGET (Q4 2026) and is labelled as one in launch.caveat. Phase 0
 * is INVITE-ONLY, so no copy here may read as open signup — the single action is
 * asking about the beta.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: meta("titleTemplate", { page: t("eyebrow") }),
    description: t("lede"),
  };
}

export default async function PricingPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  // There is no waitlist route yet, so the ask lands where every other ask
  // lands. Resolved here so ActionButton stays a plain anchor.
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

      <Section label={t("beta.label")} title={t("beta.title")}>
        <dl className="grid gap-10 md:grid-cols-2">
          {BETA.map((row) => (
            <div key={row}>
              <dt className="sc-label">{t(`beta.${row}.term`)}</dt>
              <dd className="sc-numeric mt-3 max-w-[38ch] text-lg">{t(`beta.${row}.detail`)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label={t("launch.label")} title={t("launch.title")}>
        <p className="max-w-[46ch] text-[color:var(--sc-content-muted)]">{t("launch.caveat")}</p>

        {/* No cobalt in this table — not on a row, not on a "recommended" tier.
            The page's one --sc-action is the contact button at the bottom, and a
            highlighted tier would be the second cobalt object. Hairlines only,
            matching the hr rule in app/globals.css. */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[color:var(--sc-rule)]">
                <th scope="col" className="py-3 pr-6 font-normal">
                  <span className="sc-label">{t("launch.columns.tier")}</span>
                </th>
                <th scope="col" className="py-3 pr-6 font-normal">
                  <span className="sc-label">{t("launch.columns.price")}</span>
                </th>
                <th scope="col" className="py-3 font-normal">
                  <span className="sc-label">{t("launch.columns.included")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier) => (
                <tr key={tier} className="border-b border-[color:var(--sc-rule)] align-top">
                  <th scope="row" className="py-5 pr-6 font-normal">
                    <span className="text-lg">{t(`launch.tiers.${tier}.name`)}</span>
                    <span className="mt-2 block max-w-[28ch] text-sm text-[color:var(--sc-content-muted)]">
                      {t(`launch.tiers.${tier}.note`)}
                    </span>
                  </th>
                  <td className="sc-numeric py-5 pr-6 text-lg whitespace-nowrap md:text-xl">
                    {t(`launch.tiers.${tier}.price`)}
                  </td>
                  <td className="sc-numeric py-5 text-lg whitespace-nowrap">
                    {t(`launch.tiers.${tier}.included`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-10 grid gap-4">
          {NOTES.map((note) => (
            <li key={note} className="max-w-[52ch] text-[color:var(--sc-content-muted)]">
              {t(`launch.notes.${note}`)}
            </li>
          ))}
        </ul>
      </Section>

      {/* The one cobalt object on this page. Do not add a second. */}
      <Section>
        <div className="flex flex-col items-start gap-6">
          <p className="sc-label">{t("cta.note")}</p>
          <ActionButton href={contactHref}>{t("cta.label")}</ActionButton>
          <p className="sc-label">{t("stamp")}</p>
        </div>
      </Section>
    </>
  );
}
