"use server";

/**
 * Closed-beta waitlist intake.
 *
 * Phase 0 is invite-only at roughly ten channels (business/pricing.md, rev.
 * 2026-07-22), so the "list" is a mailbox a human reads and acts on, not a
 * database anyone queries. That is why this posts an email and stores nothing:
 * at this volume a table would be a schema, a migration and a privacy surface
 * bought for no benefit. When the volume outgrows an inbox, add the store — the
 * shape of this function does not have to change.
 *
 * NO SILENT SUCCESS. If the mail credentials are absent or the send fails, this
 * returns a state that says so and the form tells the visitor to email us
 * directly. A waitlist that shows a confirmation while dropping the submission
 * is the exact failure soul.md names — it looks more capable than it is.
 *
 * Resend is called over plain fetch rather than its SDK: one POST does not earn
 * a dependency, and this keeps the deployment a static site plus one function.
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

  const key = process.env.RESEND_API_KEY;
  const to = process.env.WAITLIST_TO;
  const from = process.env.WAITLIST_FROM;
  if (!key || !to || !from) {
    // Unconfigured is not the visitor's fault and must not read as their error.
    console.warn("waitlist: RESEND_API_KEY / WAITLIST_TO / WAITLIST_FROM not set");
    return { status: "unconfigured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Waitlist — ${email}`,
        text: [`email:   ${email}`, `channel: ${channel}`].join("\n"),
      }),
    });

    if (!response.ok) {
      console.error("waitlist: resend responded", response.status, await response.text());
      return { status: "failed" };
    }
    return { status: "ok" };
  } catch (error) {
    console.error("waitlist: send threw", error);
    return { status: "failed" };
  }
}
