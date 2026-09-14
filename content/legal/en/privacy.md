---
title: Privacy Policy
summary: What SudoCut collects, why, who processes it, and how to have it deleted.
order: 2
updated: 2026-09-14
---

This policy covers the SudoCut application at
[www.sudo-cut.com](https://www.sudo-cut.com), this site at
**company.sudo-cut.com**, the closed-beta waitlist form, and our support address.

SudoCut is operated from the United States. For anything in this policy,
including any request about your own data, write to <support@sudo-cut.com>.

## 1. What we collect

### The waitlist

The waitlist is a Google Form. It collects the email address and channel link
you type into it, and nothing else. We use them only to review the request and
send an invite. Ask us and we delete them.

### Your account

You sign in with Google. From your Google account we receive your **email
address, name, profile picture and Google account ID** — the basic profile, and
nothing more. We never receive your Google password.

### Your YouTube channel, if you connect one

Connecting a channel is optional and off until you do it. If you do, we receive
the channel's name and ID, and the ability to upload videos to it on your
instruction. Section 4 sets out exactly what that covers.

### Media, and what we derive from it

The files you upload, or media we fetch from a link you give us: video, audio,
and Final Cut Pro proxy bundles. From them the service produces transcripts and
their timings, speaker segmentation, edit decisions, subtitles, previews,
project files and exported video. We also hold the technical metadata that comes
with the files — names, sizes, durations, camera and track structure.

**Your footage usually contains other people's personal information** — voices,
faces, names, whatever is said on the recording. In that material you are the
controller and we process it on your instructions, to produce the edit you asked
for and for the purposes set out in this policy.

### Usage and credits

Your projects and job history, raw minutes consumed, credit balance, and a
record of any top-up (amount and date). **We do not receive or store card
numbers.**

### Support and correspondence

Anything you send to our support address, and our replies.

### Technical records

Server logs — IP address, user agent, timestamp, request path — kept for
security and debugging. The application sets one cookie, the sign-in session
issued by Supabase Auth; it exists so that you stay signed in. **This company
site sets no cookies of its own and runs no analytics or advertising trackers.**

## 2. Why we use it

To run the service and produce your edits; to create and authenticate your
account; to meter credits and record top-ups; to answer support requests; to
keep the service secure and investigate abuse; to test, improve and develop the
service, including the models and the pipeline that make the cuts; and to meet
legal obligations such as tax and accounting records.

If you are in the EU or UK: our legal bases are performance of a contract (the
service and your account), legitimate interest (security, abuse prevention and
improving the service), consent (the waitlist), and legal obligation.

## 3. Google sign-in data, specifically

When you press "Continue with Google" we ask Google only for your basic profile
— name, email address, profile picture and Google account ID.

- We use it to create and identify your account, and to contact you about the
  service.
- **We do not request access to Gmail, Google Drive, Google Photos, Contacts,
  Calendar or any other Google service, and we cannot read them.** The one
  exception is YouTube, only if you connect a channel yourself — section 4.
- We do not sell it, do not use it for advertising, and do not share it with
  anyone other than the providers in section 5.
- You can revoke SudoCut's access at any time at
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
  Revoking it removes your way of signing in; it does not by itself delete data
  we already hold, which you can ask for separately.

## 4. YouTube: what we access, and only when you ask

**SudoCut uses YouTube API Services.** That means this section, and also the
[YouTube Terms of Service](https://www.youtube.com/t/terms) and the
[Google Privacy Policy](https://www.google.com/policies/privacy), apply to what
happens when you connect a channel. Please read them.

**Nothing here happens unless you connect a channel.** It is a separate,
optional step inside the app, with its own Google permission screen that names
what is being asked for. Decline it, or never open it, and SudoCut behaves as it
always has: you download an MP4 and a project file.

### What we ask YouTube for

Two permissions, and that is the whole list:

- **Upload videos to YouTube** — to put a finished edit on the channel you pick.
- **View your YouTube account** — to read which channel your Google account
  manages, so the app knows where the upload is going and can show you the
  channel name it is about to use.

**We deliberately do not ask for permission to edit or delete videos.** The
narrowest YouTube permission that would let us re-title a video after uploading
it also reads as *"see, edit, and permanently delete your videos, ratings,
comments and captions"*. That was too much to hold for one convenience, so the
feature was removed instead: the title, description, tags and visibility are all
set at the moment of upload, and anything already on YouTube is edited in YouTube
Studio. We do not ask ahead of time for permissions for features we have not
built.

**The read permission is broader than what we use it for.** YouTube does not
offer a "just the channel name" version of it. What follows is therefore not a
description of what the permission allows — it is a commitment about what we do.

### What we do with it

Take an edit you asked us to upload, and send it to the channel you chose, with
the title, description, tags and visibility you set. That is the whole of it.

- **Uploads arrive private by default.** Review it on your channel, then publish
  it yourself when you are ready.
- **Nothing is uploaded unless you ask for it.** Per project you can switch on
  auto-publish, which lets a render that finishes after you have closed the tab
  upload on its own — you turn that on, per project, and it still lands at the
  visibility you chose.
- **We cannot change a video once it is up**, because we did not ask for the
  permission that would allow it.
- We do not read, collect or analyse videos that SudoCut did not upload.
- We do not touch comments, likes, subscriptions or anyone's watch history.
- We do not use anything from YouTube for advertising, and we do not sell it.

### What we keep, and for how long

The channel's name and ID, the Google authorisation itself, and a record of what
SudoCut uploaded and when — so the app can show you your own history and so we
can answer a support question about a failed upload.

**Data we hold under your YouTube authorisation is deleted or refreshed within
30 days**, as YouTube's developer policies require. The upload record we keep
afterwards is our own log of our own action, not data read back from YouTube.

### How to stop it

Three ways, and any one of them is enough:

- Disconnect the channel in SudoCut. That deletes the authorisation and the
  channel details we hold for it.
- Revoke SudoCut at the Google security settings page,
  [security.google.com/settings/security/permissions](https://security.google.com/settings/security/permissions)
  (it opens as **myaccount.google.com/permissions**). We delete the associated
  data within 30 days.
- Write to <support@sudo-cut.com> and ask us to.

Revoking does not remove videos already published — they are on your channel and
they are yours. Delete those on YouTube.

Questions or complaints about any of this: <support@sudo-cut.com>.

## 5. Who processes data with us

We do not sell personal information and we do not share it for advertising. We
do use service providers, who process it only on our instructions:

| Provider | What it handles |
| --- | --- |
| Google (Sign-In, Forms, YouTube Data API) | Sign-in identity; waitlist submissions; publishing to a channel you connected |
| Supabase | Accounts, sessions, and the project database |
| Cloudflare R2 | Media, intermediate artefacts and exports |
| Speech-to-text and AI processing providers | Transcription and analysis of your audio |
| Hosting and email providers | Serving these sites and sending service email |

We also disclose data where the law requires it, and to a buyer if the business
is ever sold, in which case this policy travels with it.

## 6. Where the data goes

Our providers operate servers in the United States and elsewhere. Wherever you
are, using the service means your data — including your media and the
transcripts derived from it — is stored and processed there for the purposes in
section 2, for as long as section 7 describes. If you do not want that, do not
upload material to the beta.

## 7. How long we keep it

- **Uploads, derived data and exports** are kept while the project exists, and
  deleted when you delete the project or ask us to.
- **Account data** is kept until you close your account.
- **YouTube authorisation and channel details** are deleted or refreshed within
  30 days, and deleted when you disconnect the channel or revoke access.
- **Waitlist entries** are kept until the invite is sent or you ask us to delete
  them.
- **Top-up records** are kept as long as tax and commercial law requires.
- **Server logs** are kept for a short operational period.

## 8. Your rights

You may ask us to show you the personal data we hold about you, correct it,
delete it, stop or restrict processing, or withdraw a consent you gave. Write to
<support@sudo-cut.com>. We answer within 30 days. Withdrawing consent does not
undo processing that already happened.

Depending on where you live, you may also have the right to complain to your
local data protection authority.

## 9. Children

SudoCut is a tool for people who publish video professionally. It is not for
children under 14, and we do not knowingly collect their personal information.
If you believe a child has given us data, write to <support@sudo-cut.com> and we
will delete it.

## 10. Security

Data is encrypted in transit, and at rest by our storage providers. Media is
served through short-lived signed URLs. Access to production data is limited to
the people who need it to run the service.

**Honestly:** we are a very small team running a closed beta. We hold no
security certification, and we say so rather than implying an audit that has not
happened. If you find a security problem, please tell us at
<support@sudo-cut.com>.

## 11. Changes

We may update this policy. The date at the top changes with it, and we email
beta users before a material change takes effect.

## 12. Contact

<support@sudo-cut.com>
