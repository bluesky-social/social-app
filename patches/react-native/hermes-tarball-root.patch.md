## hermes-engine/build.gradle.kts Patch - Hermes source tarball folder renamed by the repo move

We build React Native from source on Android (`buildReactNativeFromSource`), which makes the
`hermes-engine` project download the Hermes source from
`https://github.com/facebook/hermes/tarball/<tag>` and extract it into `sdks/hermes`.

On 2026-10-28 `facebook/hermes` moved to `meta/hermes`. The URL still works through a 301
redirect, but GitHub names a tarball's top-level folder `<owner>-<repo>-<sha>`, so it changed
from `facebook-hermes-<sha>/` to `meta-hermes-<sha>/`. `unzipHermes` only flattened entries
starting with `facebook-hermes-`, so the source landed in `sdks/hermes/meta-hermes-<sha>/` and
`configureBuildForHermes` failed:

```
CMake Error: The source directory ".../node_modules/react-native/sdks/hermes" does not appear to contain CMakeLists.txt.
```

Any build that downloads Hermes again fails this way: CI, fresh clones, and any change to our
React Native patches (which installs React Native into a new folder).

**The fix**: always strip the tarball's single top-level folder, whatever its name. The folly,
fmt and fast_float download tasks in `ReactAndroid/build.gradle.kts` already do this. For the old
`facebook-hermes-` tarballs the behaviour is unchanged.

Standalone repro: https://github.com/mozzius/hermes-tarball-repro

Opened issue in RN repo: https://github.com/react/react-native/issues/59587 (React Native `main`
and `0.88-stable` still had the old check on 2026-10-28).

Upstream PR: https://github.com/react/react-native/pull/59588
