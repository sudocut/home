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

ROUND=""
for d in "$ROOT"/design/rounds/r[0-9]*; do
  [ -d "$d" ] && ROUND="$(basename "$d")"
done

board_url() {
  if [ -n "$ROUND" ]; then
    echo "http://localhost:$1/design/board/?round=$ROUND"
  else
    echo "http://localhost:$1/design/board/"
  fi
}

# A busy port is usually THIS server, still running from earlier — that is not a
# failure, it is the board you were about to start. Telling you to pick another
# port would leave two servers up and the second one is the one you would close.
# So ask what is answering: fetch a file and compare it to ours byte for byte.
# Same bytes means same tree (this repo has sibling worktrees, and they differ).
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  WHO="$(python3 - "$PORT" "$ROOT" <<'PY' 2>/dev/null || true
import os, sys, urllib.request
port, root = sys.argv[1], sys.argv[2]
rel = "design/board/board.js"
try:
    served = urllib.request.urlopen(f"http://127.0.0.1:{port}/{rel}", timeout=2).read()
    local = open(os.path.join(root, rel), "rb").read()
except Exception:
    print("foreign")
else:
    print("ours" if served == local else "other-tree")
PY
)"
  case "$WHO" in
    ours)
      echo
      echo "  already serving this repo on port $PORT — nothing to start."
      echo
      echo "  board →  $(board_url "$PORT")"
      echo
      echo "  to restart it:  lsof -ti tcp:$PORT | xargs kill"
      echo
      exit 0
      ;;
    other-tree)
      echo "error: port $PORT is serving a DIFFERENT tree (another worktree?)." >&2
      echo "       Rank there, or start this one elsewhere: bash tools/serve.sh $((PORT + 1))" >&2
      exit 1
      ;;
    *)
      echo "error: port $PORT is in use by something that is not a board server." >&2
      echo "       Try: bash tools/serve.sh $((PORT + 1))" >&2
      exit 1
      ;;
  esac
fi

echo
echo "  serving $ROOT on http://localhost:$PORT"
echo
echo "  board →  $(board_url "$PORT")"
[ -n "$ROUND" ] || echo "  (no rounds yet — bash tools/new-round.sh)"
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
