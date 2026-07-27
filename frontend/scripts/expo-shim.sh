#!/usr/bin/env bash
# Fork·Fate is a React (CRA/craco) web app, but the platform's supervisor program
# and its deploy pipeline both drive the frontend through an `expo` binary. This
# shim translates the handful of expo commands they use into craco equivalents.
#
# Rules that matter:
#   * `config` MUST print nothing but JSON on stdout (the deploy step parses it —
#     a stray "yarn run v1.22.22" banner is what broke the production build).
#   * `start` runs the CRA dev server on PORT (default 3000).
#   * `export` produces a static build; expo writes to dist/, craco to build/, so
#     the output is mirrored into dist/ as well.
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$FRONTEND_DIR"

CMD="${1:-start}"
[ $# -gt 0 ] && shift || true

case "$CMD" in
  config)
    # The resolved config is app.json's "expo" object, exactly like `expo config --json`.
    node -e 'const c=require("./app.json");process.stdout.write(JSON.stringify(c.expo||c))'
    ;;
  start)
    export PORT="${PORT:-3000}"
    export BROWSER=none
    exec yarn --silent craco start
    ;;
  export|build)
    yarn --silent craco build
    rm -rf dist
    cp -r build dist
    ;;
  install|add)
    exec yarn --silent add "$@"
    ;;
  *)
    # Anything else (doctor, prebuild, whoami…) is a no-op for a web app.
    echo "{}"
    ;;
esac
