/**
 * waitlist-sheet.gs — receives closed-beta signups and appends them to a Sheet.
 *
 * Paste this into a Google Sheet's Apps Script editor and publish it. Four steps,
 * about five minutes, and NO DNS RECORDS — which is the whole reason this exists
 * instead of a transactional mail provider.
 *
 *   1. In Google Drive (signed in as the sudo-cut.com Workspace account), make a
 *      new Sheet. Name it something like "SudoCut — closed beta waitlist".
 *
 *   2. Extensions → Apps Script. Delete the stub, paste this file, and change
 *      SECRET below to a long random string. Generate one with:
 *          node -e "console.log(crypto.randomUUID())"
 *
 *   3. Deploy → New deployment → type "Web app".
 *          Execute as:      Me
 *          Who has access:  Anyone
 *      "Anyone" is required — Vercel's function calls this unauthenticated. It is
 *      not open season: the URL is unguessable and SECRET is checked on every
 *      request. Authorise the scopes when prompted.
 *
 *   4. Copy the deployment's Web app URL (…/exec) and set both in Vercel →
 *      Settings → Environment Variables, and in .env.local for development:
 *          WAITLIST_ENDPOINT = the /exec URL
 *          WAITLIST_SECRET   = the same string as SECRET below
 *
 * Editing this script later does NOT change what is live. Deploy → Manage
 * deployments → edit → New version. Forgetting that is the usual reason a fix
 * appears to do nothing.
 *
 * The Sheet is personal data — email addresses and channel links people gave us
 * for one purpose. Keep it inside the Workspace, share it with people who need
 * it rather than by link, and delete rows when someone asks. business/README.md
 * says keep personal data out of git; the same reasoning applies to a public
 * link.
 */

// CHANGE THIS. Must match WAITLIST_SECRET in the site's environment.
const SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

const HEADERS = ['received', 'email', 'channel', 'locale', 'status'];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'empty body' });
    }

    const body = JSON.parse(e.postData.contents);

    // Constant-ish time is overkill here, but an early return on a wrong secret
    // must not reveal anything else about the request.
    if (body.secret !== SECRET) {
      return json({ ok: false, error: 'unauthorised' });
    }

    const email = String(body.email || '').trim();
    const channel = String(body.channel || '').trim();
    if (!email || !channel) {
      return json({ ok: false, error: 'missing email or channel' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // A lock, because two people can submit in the same second and appendRow is
    // not atomic across concurrent executions — without this they overwrite.
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      // 'status' starts as "new" so the sheet doubles as the review queue: change
      // it to invited/declined as you work through the ~10.
      sheet.appendRow([new Date(), email, channel, String(body.locale || ''), 'new']);
    } finally {
      lock.releaseLock();
    }

    return json({ ok: true });
  } catch (err) {
    // Returned as ok:false, so the site reports a failure rather than a
    // confirmation for a row that was never written.
    return json({ ok: false, error: String(err) });
  }
}

/** GET exists only so you can open the URL and confirm the deployment is live. */
function doGet() {
  return json({ ok: true, service: 'sudocut-waitlist' });
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
