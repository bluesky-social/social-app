#!/usr/bin/env bash
#
# Resolve an upstream-merge conflict in the Lingui catalogs, the safe way.
#
# The message catalogs (src/locale/locales/*/messages.po) are generated:
#   - msgids come from our source via `lingui extract`
#   - msgstr translations come from upstream (merge) / Crowdin
# Never hand-merge a .po conflict. This takes upstream's ("theirs") version of
# any conflicted catalog (keeping their translations), then regenerates from our
# merged source so fork-added strings are re-added to en/messages.po.
#
# Run while an upstream merge is conflicted (or any time, to resync):
#   pnpm intl:resync
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Take upstream's side of any conflicted catalog.
conflicted=$(git diff --name-only --diff-filter=U -- 'src/locale/locales/*/messages.po' 2>/dev/null || true)
if [ -n "$conflicted" ]; then
  echo "Taking upstream version of:"
  echo "$conflicted"
  echo "$conflicted" | while IFS= read -r f; do
    [ -z "$f" ] && continue
    git checkout --theirs -- "$f"
    git add -- "$f"
  done
fi

# Regenerate: re-extract en source (re-adds fork strings) + recompile runtime.
pnpm intl:extract
pnpm intl:compile
git add src/locale/locales

printf '\nCatalogs resynced from source. Review the staged changes, then commit the merge.\n'
