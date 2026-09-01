# Help documents

Every file in `content/help/<locale>/<slug>.md` is one page on the site, served at
`/<locale>/help/<slug>`. The markdown file is the source document — nothing here
is duplicated into `messages/`, and nothing is edited in the browser.

To publish a document: add a `.md` file, commit, deploy. To unpublish: delete it.
There is no draft state and no CMS.

## Frontmatter

```markdown
---
title: How the closed beta works
summary: One line for the index page. Optional but recommended.
order: 1
updated: 2026-08-27
---

Body starts here. Start headings at `##` — the page's `<h1>` is the frontmatter
title, so an `h1` in the body would be a second one.
```

| Key | Required | Notes |
| --- | --- | --- |
| `title` | yes | The `<h1>` and the link text in the index. |
| `summary` | no | Shown under the title in the index. |
| `order` | no | Ascending. Files without it sort last, then alphabetically by title. |
| `updated` | no | `YYYY-MM-DD`. Shown verbatim — not reformatted per locale. |

Values may be quoted (`title: "A: with a colon"`). This is a deliberate subset of
YAML, not a YAML parser: one `key: value` per line, no nesting, no lists. See
`src/content/docs.ts`.

## Locales

`en` is the canonical set. A slug that exists in `en/` but not `ko/` still has a
working `/ko/help/<slug>` link — the page serves the English text and says so, in
Korean, above the document. A shared link never 404s because a translation is
late.

A slug that exists only in `ko/` works the same way in reverse: it appears in the
English index, serving the Korean text under a notice.

So the pair to keep in sync is the file names. If you add `en/refunds.md`, add
`ko/refunds.md` when the translation is ready — same slug, same `order`.

## Markdown

CommonMark plus GitHub tables, strikethrough, and task lists (`remark-gfm`).
Raw HTML is **not** rendered; it is escaped. That is on purpose — a help document
is prose, and the page's styling is the site's, not the document's.

Links to other help documents should be written locale-absolute:
`[top-ups](/en/help/closed-beta)`.

`remark-gfm` autolinks any bare literal starting `www.`, and it takes the rest of
the run with it — `**www.example.com**` becomes a link whose href includes the
closing asterisks, and in Korean the attached particle too. Write such domains as
an explicit `[text](url)` link.
