import { useTranslations } from "next-intl";

/**
 * The YouTube integration band — constitution D12.
 *
 * WHY IT EXISTS, stated plainly because it is not a taste decision. The
 * YouTube API Services audit form has a required field:
 *
 *   "Homepage Screenshot — showing where Privacy Policy link is located with
 *    YouTube branding visible"
 *
 * One screenshot, two things in it. That is the whole reason this sits at the
 * bottom of the page rather than anywhere else: the footer's privacy link is
 * the next thing down the document, so a single viewport capture of the page
 * tail carries both, and a full-page capture obviously does. Moving this band
 * up the page does not break the layout — it breaks the evidence.
 *
 * The second reason is the developer policies: a page that shows YouTube
 * content has to display YouTube Brand Features so that "YouTube is the source
 * of the relevant content" is clear. The trust band above already shows six
 * channels' profile images and links to them, and until now this page named
 * YouTube in body copy and nowhere else.
 *
 * WHICH LOGO, AND WHY IT IS NOT A CHOICE. The standard YouTube logo, because
 * the branding guidelines reserve "Developed with YouTube" for an application
 * "entirely dependent on ... its integration with YouTube" and SudoCut is not
 * — the deliverable is an MP4 and a project file whether or not a channel is
 * ever connected. Full colour, Almost Black wordmark, official PNG, uncropped.
 * public/brands/youtube/README.md records the archive it came from, its hash,
 * the measured geometry and the reading of the minimum-size rule.
 *
 * THE LINK IS A REQUIREMENT, NOT DECORATION. "Any YouTube logo used within an
 * application must link back to YouTube content or to a YouTube component of
 * that application" — and the guidelines name the YouTube homepage as an
 * acceptable destination. It is not a link to our privacy policy, not `#`, and
 * not a guessed route inside the app: this repository is the company site and
 * cannot verify a path in sudocut/web.
 *
 * NO COBALT HERE. The one point colour on this page stays on the waitlist
 * button in the hero (S1). This band is ink on paper plus one third-party file
 * that brings its own pixels, exactly as D8 already allows for the channel
 * avatars and D12 now allows for this.
 */
export function YouTubeConnect() {
  const t = useTranslations("home.youtube");

  return (
    <section aria-labelledby="sc-yt-head" className="sc-yt">
      <div className="sc-wrap">
        <div className="sc-yt-copy">
          <p className="sc-yt-label">{t("label")}</p>
          <h2 className="sc-yt-head" id="sc-yt-head">
            {t("title")}
          </h2>
          <p className="sc-yt-body">{t("body")}</p>
          <p className="sc-yt-note">{t("note")}</p>
        </div>

        {/* The accessible name is the alt text plus the new-tab warning, read
            once. The image is the only content of the link, so it carries the
            name — an empty alt here would leave a link with nothing to announce. */}
        <a
          className="sc-yt-link"
          href="https://www.youtube.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          {/* biome-ignore lint/performance/noImgElement: the official asset is a
              fixed local PNG that must reach the page unprocessed — no resizing
              pipeline, no format conversion, no recompression. */}
          <img
            alt={t("logoAlt")}
            className="sc-yt-logo"
            height={573}
            src="/brands/youtube/yt_logo_fullcolor_almostblack_digital.png"
            width={1705}
          />
          <span className="sr-only">{t("newTab")}</span>
        </a>
      </div>
    </section>
  );
}
