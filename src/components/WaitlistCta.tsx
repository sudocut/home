import { useTranslations } from "next-intl";
import { CREATOR_APPLICATION_URL } from "@/content/creator-application";

/** The single cobalt action on the home page. */
export function WaitlistCta() {
  const t = useTranslations("creatorApplication");

  return (
    <div className="sc-wait" id="waitlist">
      <p className="sc-wait-label">{t("label")}</p>
      <div className="sc-wait-row">
        <a
          className="sc-btn"
          href={CREATOR_APPLICATION_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("submit")}
        </a>
      </div>
    </div>
  );
}
