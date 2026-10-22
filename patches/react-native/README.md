# react-native patches

pnpm supports one patch per package, so `patches/react-native@<version>.patch`
is generated from the patches in this directory. Each one is a diff against
pristine react-native and has a `.patch.md` explaining it. Patches that
backport an upstream PR are named `pr-<number>-<commit sha>.patch`, using the
first 10 characters of the commit that landed (or of the PR head).

Regenerate the combined patch after any change here:

```sh
pnpm patch:react-native
```

## Editing a patch

```sh
pnpm patch react-native@<version> --ignore-existing --edit-dir node_modules/.edit-react-native
cd node_modules/.edit-react-native
git init -q && git add -A && git commit -qm pristine
git apply ../../patches/react-native/<name>.patch # skip for a new patch
# edit files, then:
git add -A && git diff --cached > ../../patches/react-native/<name>.patch
```

## Upgrading react-native

Update the version in the `patch:react-native` script, remove the old entry
from `patchedDependencies` in `pnpm-workspace.yaml` along with the old combined
patch, and regenerate. For patches that no longer apply, follow the steps above
with `git apply --reject` and port the `.rej` hunks by hand.
