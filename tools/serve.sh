#!/usr/bin/env bash
# serve.sh — serve the repo so the ranking board can load variants.
#
#   bash tools/serve.sh [port]     # default 4173
#
# Rooted at the REPO ROOT, not at design/, because variants link
# /brand/tokens/tokens.css and /fonts/* by absolute path. Serving from
# anywhere else silently breaks every variant's styling.
#
# Zero dependencies: uses python3's built-in server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-4173}"

command -v python3 >/dev/null 2>&1 || {
  echo "error: python3 not found. Alternative: npx --yes serve -l $PORT '$ROOT'" >&2
  exit 1
}

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "error: port $PORT is already in use. Try: bash tools/serve.sh $((PORT + 1))" >&2
  exit 1
fi

ROUND=""
for d in "$ROOT"/design/rounds/r[0-9]*; do
  [ -d "$d" ] && ROUND="$(basename "$d")"
done

echo
echo "  serving $ROOT on http://localhost:$PORT"
echo
if [ -n "$ROUND" ]; then
  echo "  board →  http://localhost:$PORT/design/board/?round=$ROUND"
else
  echo "  board →  http://localhost:$PORT/design/board/"
  echo "  (no rounds yet — bash tools/new-round.sh)"
fi
echo
echo "  ctrl-c to stop"
echo

cd "$ROOT"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
