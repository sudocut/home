# Legal documents

`content/legal/<locale>/terms.md` → `/<locale>/terms`
`content/legal/<locale>/privacy.md` → `/<locale>/privacy`

Same parser, frontmatter and markdown subset as the help library — see
`content/help/README.md` for the authoring contract, and `src/content/docs.ts`
for the code. Two differences, both deliberate:

1. **The slugs are fixed.** There is no index page and no `generateStaticParams`;
   `app/[locale]/terms` and `app/[locale]/privacy` name their file directly.
   These URLs are recorded outside this repository — the Google OAuth consent
   screen stores both — so they are not free to move. Adding a third legal
   document means adding a third route on purpose.
2. **English is the authority.** The Korean files are translations of the English
   ones and both say so in their opening lines; for Korean users the Korean text
   is what applies. Change one and change the other in the same commit, or the
   two versions promise different things.

Bump `updated:` whenever the text changes materially — the pages print it, and
both documents promise beta users an email before a material change takes effect.
