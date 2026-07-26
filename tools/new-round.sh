#!/usr/bin/env bash
# new-round.sh — start the next design round from the template.
#
#   bash tools/new-round.sh          # next number after the newest round
#   bash tools/new-round.sh r4       # a specific round
#
# Refuses to clobber an existing round. Rounds are the git record.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROUNDS="$ROOT/design/rounds"
TEMPLATE="$ROUNDS/_template"

[ -d "$TEMPLATE" ] || { echo "error: $TEMPLATE is missing" >&2; exit 1; }

if [ $# -ge 1 ]; then
  ROUND="$1"
  case "$ROUND" in
    r[0-9]*) ;;
    *) echo "error: round must look like r1, r2, ... (got '$ROUND')" >&2; exit 1 ;;
  esac
else
  LAST=0
  for d in "$ROUNDS"/r[0-9]*; do
    [ -d "$d" ] || continue
    n="$(basename "$d")"; n="${n#r}"
    [ "$n" -gt "$LAST" ] 2>/dev/null && LAST="$n"
  done
  ROUND="r$((LAST + 1))"
fi

DEST="$ROUNDS/$ROUND"
if [ -e "$DEST" ]; then
  echo "error: design/rounds/$ROUND already exists — rounds are immutable once run." >&2
  echo "       To redo it, pick a new number or delete the directory deliberately." >&2
  exit 1
fi

cp -R "$TEMPLATE" "$DEST"
# the template ships an empty variants/ via .gitkeep; keep it
mkdir -p "$DEST/variants"

# stamp the round number into the copied files
for f in "$DEST/BRIEF.md" "$DEST/RANKING.md" "$DEST/VERDICT.md"; do
  [ -f "$f" ] || continue
  sed -i '' "s/{{ROUND}}/$ROUND/g" "$f" 2>/dev/null || sed -i "s/{{ROUND}}/$ROUND/g" "$f"
done

PREV="r$(( ${ROUND#r} - 1 ))"
echo "created design/rounds/$ROUND"
echo
if [ -f "$ROUNDS/$PREV/VERDICT.md" ]; then
  echo "  1. read   design/rounds/$PREV/VERDICT.md   (what the last round settled)"
  echo "  2. write  design/rounds/$ROUND/BRIEF.md    (the delta to test this round)"
else
  echo "  1. write  design/rounds/$ROUND/BRIEF.md    (what to design this round)"
fi
echo "  3. run    node tools/generate.mjs $ROUND"
echo "  4. check  node tools/verify-round.mjs $ROUND"
echo "  5. rank   bash tools/serve.sh"
echo
