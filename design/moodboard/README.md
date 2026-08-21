# Moodboard — moved

The 34 reference images and their per-image source table are no longer in this
repository. **This repository is public**, and the images were collected from
third-party pin boards, portfolio galleries, and social posts. Each one recorded a
source URL, but none recorded a license, a permission, or any other basis for
redistributing it.

Redistributing other people's work from the company's own public repository is not
a risk worth carrying for a set of reference images that nobody outside the design
rounds ever looks at.

## Where they are now

`sudocut/web` — [`design/moodboards/minimal-1-point-color/`](https://github.com/sudocut/web/tree/main/design/moodboards/minimal-1-point-color)

That repository is private, and its copy is complete: the same 34 files, plus a
README carrying the source board, the per-image accent colors, and every source
link. Nothing was lost in the move, because the private copy already existed and
was never a subset.

## What stayed here

The moodboard's **conclusion** stayed, because a conclusion is not someone else's
image. [`design/BRIEF.md` §4c](../BRIEF.md) records what the recorded accents
actually showed — near-white and off-white base, a recurring warm taupe and
parchment family, near-black as the contrast note, almost nothing saturated — and
reads it as a brief for rhythm rather than palette, since the palette is fixed.

That distilled direction is what every round from r2 onward actually cited. The
images were only ever there for a human judge to compare against, and a judge who
needs them can open the private repository.

## Honest limitation

Deleting a file does not delete it from Git history. Anyone who clones this public
repository can still recover the images from earlier commits. Closing that requires
a coordinated history rewrite, which is a separate decision with its own cost — it
breaks every existing clone and every commit reference.

This change stops the ongoing exposure: the images are gone from the default branch,
from the repository's file listing, from search, and from every future clone's
working tree. The residual history exposure is tracked in the company brain as
`risk-public-reference-image-licensing` and stays open until that decision is made.

If a coordinated rewrite ever happens, delete this file too.
