"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { joinWaitlist, WAITLIST_INITIAL } from "@/actions/waitlist";

/**
 * The closed-beta waitlist — and the single cobalt object on the whole site.
 * Nothing else may use --sc-action while this is on the page.
 *
 * Two fields, because Phase 0 is invite-only at roughly ten channels: the
 * channel link is not a nice-to-have, it is how those ten get chosen. An email
 * on its own would leave every decision unmakeable.
 *
 * The winning r4 variant was the only one that made this a working control
 * rather than a picture of one, so validation and a success state are part of
 * what was ranked. What is new here is that it now actually sends something.
 *
 * Every failure mode has its own message. In particular an unconfigured server
 * never renders as success and never blames the visitor — it hands them the
 * address instead, so a submission is not silently lost.
 */
export function WaitlistForm() {
  const t = useTranslations("waitlist");
  const contact = useTranslations("contact");
  const id = useId();
  const [state, formAction, pending] = useActionState(joinWaitlist, WAITLIST_INITIAL);

  const email = contact("email");
  const failed = state.status === "unconfigured" || state.status === "failed";

  return (
    <form action={formAction} className="sc-wait" id="waitlist">
      <label htmlFor={`${id}-email`}>{t("label")}</label>

      {state.status === "ok" ? (
        <p className="sc-wait-ok" role="status">
          {t("success")}
        </p>
      ) : (
        <>
          <div className="sc-wait-fields">
            <input
              aria-invalid={state.status === "invalidEmail"}
              aria-label={t("emailLabel")}
              autoComplete="email"
              defaultValue=""
              id={`${id}-email`}
              name="email"
              placeholder={t("placeholder")}
              required
              type="email"
            />
            <input
              aria-invalid={state.status === "invalidChannel"}
              aria-label={t("channelLabel")}
              autoComplete="url"
              defaultValue=""
              id={`${id}-channel`}
              name="channel"
              placeholder={t("channelPlaceholder")}
              required
              type="text"
            />
          </div>

          {/* Honeypot: off-screen rather than display:none, which some password
              managers and bots both skip. Never shown, never tabbed to. */}
          <input
            aria-hidden="true"
            autoComplete="off"
            className="sc-honey"
            name="company"
            tabIndex={-1}
          />

          <div className="sc-wait-row">
            {/* The one cobalt object. Do not add a second anywhere in this view. */}
            <button className="sc-btn" disabled={pending} type="submit">
              {pending ? t("sending") : t("submit")}
            </button>
          </div>
        </>
      )}

      {state.status === "invalidEmail" && (
        <p className="sc-wait-err" role="alert">
          {t("error")}
        </p>
      )}
      {state.status === "invalidChannel" && (
        <p className="sc-wait-err" role="alert">
          {t("channelError")}
        </p>
      )}
      {failed && (
        <p className="sc-wait-err" role="alert">
          {t("failed")} <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}

      <p className="sc-wait-note">{t("note")}</p>
      <p className="sc-wait-note">{t("privacy")}</p>
    </form>
  );
}
