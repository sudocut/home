import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WaitlistCta } from "@/components/WaitlistCta";

type LocaleParams = { locale: string };

/**
 * The channels named on the trust band — added at the founder's request,
 * 2026-08-17: "trusted partners and channels that are using our service."
 * Handles are locale-invariant identifiers rather than copy, so like the
 * waitlist FORM_URL they live here and not in messages/. Each name is the
 * channel's own YouTube title, checked against youtube.com/@{handle} on
 * 2026-08-17 — all five resolved.
 */
const CHANNELS = [
  { handle: "eo_korea", name: "EO Korea" },
  { handle: "eoglobal", name: "EO" },
  { handle: "sudoremove", name: "sudoremove" },
  { handle: "chester_roh", name: "AI Frontier Korea (노정석)" },
  { handle: "eegirit", name: "이기릿 EEgirIT" },
] as const;

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
 * the top, so the figures band arrives while the visitor is still reading. Both
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
        {/* Names the five channels the story figure counts, so the number above
            is checkable rather than claimed. A content addition to the r4
            layout at the founder's request (2026-08-17), not a ranked-round
            change. Monochrome links only — the waitlist button above keeps the
            page's one cobalt. */}
        <section aria-label={t("channels.label")} className="sc-channels">
          <p className="sc-label">{t("channels.label")}</p>
          <ul className="sc-channel-list">
            {CHANNELS.map((channel) => (
              <li key={channel.handle}>
                <a
                  className="sc-channel"
                  href={`https://www.youtube.com/@${channel.handle}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="sc-channel-name">{channel.name}</span>
                  <span className="sc-channel-handle">@{channel.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Names the deliverable, which every r4 variant left unsaid — see the
            r4 verdict. Replaces an illustrative "14:32 → 10:47" that came from
            brand/voice.md's examples and measured nothing. */}
        <p className="sc-example">
          {t("deliverable.before")}
          <span className="sc-numeric">{t("deliverable.figure")}</span>
          {t("deliverable.after")}
        </p>
      </div>
    </>
  );
}
