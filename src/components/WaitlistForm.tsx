"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

/**
 * The closed-beta waitlist — and the single cobalt object on the whole site.
 * Nothing else may use --sc-action while this is on the page.
 *
 * The winning r4 variant was the only one that made this a working control
 * rather than a picture of one, so the validation and success state are part of
 * what was ranked, not an embellishment.
 *
 * HONESTY: there is no backend yet. Submitting validates the address and shows
 * the confirmation, but nothing is stored and no email is sent. soul.md's
 * "honesty over polish" applies to us as much as to the demo — wire this to a
 * real list before launch, or the confirmation is a lie. Tracked in README.
 */
export function WaitlistForm() {
  const t = useTranslations("waitlist");
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  return (
    <form
      className="sc-wait"
      id="waitlist"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const value = email.trim();
        setState(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "done" : "error");
      }}
    >
      <label htmlFor={id}>{t("label")}</label>

      {state === "done" ? (
        <p className="sc-wait-ok" role="status">
          {t("success")}
        </p>
      ) : (
        <div className="sc-wait-row">
          <input
            aria-describedby={state === "error" ? `${id}-err` : undefined}
            aria-invalid={state === "error"}
            autoComplete="email"
            id={id}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("placeholder")}
            required
            type="email"
            value={email}
          />
          {/* The one cobalt object. Do not add a second anywhere in this view. */}
          <button className="sc-btn" type="submit">
            {t("submit")}
          </button>
        </div>
      )}

      {state === "error" && (
        <p className="sc-wait-err" id={`${id}-err`} role="alert">
          {t("error")}
        </p>
      )}

      <p className="sc-wait-note">{t("note")}</p>
    </form>
  );
}
