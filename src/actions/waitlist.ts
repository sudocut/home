"use server";

/**
 * Closed-beta waitlist intake → a Google Sheet, via an Apps Script web app.
 *
 * WHY THIS AND NOT EMAIL. Phase 0 picks roughly ten channels out of everyone who
 * applies (business/pricing.md, rev. 2026-07-22). That is a review job: sort the
 * applicants, look at each channel, mark the ones you invited. A spreadsheet does
 * all of that and an inbox does none of it — so the Sheet is not the lazy option
 * here, it is the correct shape for the task. We run Google Workspace on this
 * domain already, so it costs nothing extra and no third party holds the list.
 *
 * WHY NOT GOOGLE FORMS. Posting to a Form's /formResponse endpoint answers 200
 * for anything, including submissions it silently discards — there is no way to
 * tell a stored signup from a dropped one. That is exactly the failure this
 * function exists to prevent. An Apps Script web app returns a real JSON result,
 * so "saved" can be distinguished from "not saved". (Embedding the Form itself
 * was never an option: it would drop a Google-styled widget into a closed
 * palette and cost the page its one cobalt object.)
 *
 * NO SILENT SUCCESS. Missing config, a non-2xx, an error from the script, and a
 * network failure are four distinct states and none of them renders as a
 * confirmation. The visitor is given the support address instead, so a
 * submission is never quietly lost. soul.md: a thing that looks more capable
 * than it is breaks trust.
 *
 * Plain fetch, no SDK and no database. Deployment stays a static site plus one
 * function. When the volume outgrows a Sheet, only the endpoint changes.
 *
 * Setup is four steps and no DNS: tools/waitlist-sheet.gs.
 */

export type WaitlistState = {
  status: "idle" | "ok" | "invalidEmail" | "invalidChannel" | "unconfigured" | "failed";
};

export const WAITLIST_INITIAL: WaitlistState = { status: "idle" };

// Deliberately permissive: the server is not the place to argue with an address
// that a mail server will adjudicate anyway. This rejects typos, not people.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A channel link has to be a real http(s) URL; which platform is not our call. */
function normaliseChannel(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  // Creators paste "youtube.com/@name" as often as a full URL. Accept both.
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function joinWaitlist(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  // Honeypot. Real people never fill a field they cannot see; bots fill every
  // field they find. Accept silently rather than reporting a failure, so a bot
  // learns nothing about why it did not work.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "ok" };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email)) return { status: "invalidEmail" };

  const channel = normaliseChannel(String(formData.get("channel") ?? ""));
  if (!channel) return { status: "invalidChannel" };

  const endpoint = process.env.WAITLIST_ENDPOINT;
  const secret = process.env.WAITLIST_SECRET;
  if (!endpoint || !secret) {
    // Unconfigured is not the visitor's fault and must not read as their error.
    console.warn("waitlist: WAITLIST_ENDPOINT / WAITLIST_SECRET not set");
    return { status: "unconfigured" };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      // Apps Script rejects a preflight on application/json but accepts a plain
      // text body, which doPost reads verbatim from e.postData.contents. The
      // payload is still JSON; only the declared type differs.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret,
        email,
        channel,
        locale: String(formData.get("locale") ?? ""),
      }),
      // A published web app answers with a 302 to googleusercontent.com; fetch
      // follows it by default, and the JSON we care about is behind it.
      redirect: "follow",
    });

    if (!response.ok) {
      console.error("waitlist: endpoint responded", response.status, await response.text());
      return { status: "failed" };
    }

    // A 200 is not proof it stored anything — the script reports that itself,
    // and an unparseable body means we do not know, which is not success.
    const body = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!body?.ok) {
      console.error("waitlist: script rejected the row", body?.error ?? "unparseable response");
      return { status: "failed" };
    }

    return { status: "ok" };
  } catch (error) {
    console.error("waitlist: post threw", error);
    return { status: "failed" };
  }
}
