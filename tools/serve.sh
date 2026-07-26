#!/usr/bin/env bash
# serve.sh — serve the repo so the ranking board can load variants.
#
#   bash tools/serve.sh [port]     # default 4173
#
# Rooted at the REPO ROOT, not at design/, because variants link
# /brand/tokens/tokens.css and /fonts/* by absolute path. Serving from
# anywhere else silently breaks every variant's styling.
#
# `/brand/*` resolves at the root, but `/fonts/*` does NOT — the files live in
# public/, which Next.js serves at `/` and a plain static server does not. So we
# mirror that one rule: a path missing at the root is retried under public/.
# Without it every variant renders in fallback system fonts and you rank the
# wrong typography.
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
exec python3 - "$PORT" <<'PY'
import os, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.getcwd()
PUBLIC = os.path.join(ROOT, "public")


class Handler(SimpleHTTPRequestHandler):
    """Static server with Next.js's public/ semantics.

    Next serves public/ at the site root, so tokens.css asks for
    /fonts/Hahmlet-Variable.ttf and gets public/fonts/Hahmlet-Variable.ttf.
    A plain static server 404s that. Retry under public/ when — and only
    when — the path is absent at the root, so the root always wins.
    """

    def translate_path(self, path):
        resolved = super().translate_path(path)
        if os.path.exists(resolved):
            return resolved
        rel = os.path.relpath(resolved, ROOT)
        if rel.startswith(os.pardir):
            return resolved
        fallback = os.path.join(PUBLIC, rel)
        return fallback if os.path.exists(fallback) else resolved

    def end_headers(self):
        # Variants are edited between reloads; a cached one is a wrong ranking.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


ThreadingHTTPServer(
    ("127.0.0.1", int(sys.argv[1])), partial(Handler, directory=ROOT)
).serve_forever()
PY
