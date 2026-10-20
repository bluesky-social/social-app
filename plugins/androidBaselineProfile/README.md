# Android Baseline Profiles and startup benchmarks

A [Baseline Profile](https://developer.android.com/topic/performance/baselineprofiles/overview)
lists the classes and methods ART should compile ahead of time when the app is
installed. Without one, the code that runs at startup is interpreted and
JIT-compiled on every cold start until background dexopt or Play's cloud
profiles catch up, and cloud profiles start over with every release.

`withAndroidBaselineProfile.js` ships every file in `profiles/` with the app
(AGP merges them with the profiles AndroidX libraries ship) and adds
ProfileInstaller, which installs the profile outside of Play.

- `profiles/react-native.txt` is ReactAndroid's startup code, from
  https://github.com/react/react-native/pull/59175 (commit `d54294584fe3`). Delete it
  once React Native ships it in `react-android`. About 5% of its rules don't
  match 0.86.3, which only means those methods aren't compiled.
- `profiles/app.txt` is recorded from our own cold start, with
  `BaselineProfileGenerator`.

Rules that don't match anything in the app are ignored, so a stale profile only
loses coverage.

## Running the benchmarks

Needs a physical device on Android 13+ (API 33) to record a profile, since
recording on older versions needs root. Measuring works from Android 9. Gradle
runs on every connected device, so with an emulator open too, pick the phone
with `ANDROID_SERIAL=<serial from adb devices>`.

1. `pnpm android:benchmark:prebuild` regenerates `android/` with the
   `benchmark` module and the app's `benchmark` build type (release, but
   profileable and signed with the debug key). Plain `pnpm prebuild` leaves them
   out.
2. `pnpm android:benchmark:install`, then open the app and log in. The
   benchmarks wait for posts in the home feed, and the scripts below keep the
   app installed, and its data, between runs.
3. `pnpm android:benchmark` runs `StartupBenchmark`: 15 cold starts with
   nothing compiled ahead of time, then 15 with only the Baseline Profile
   compiled, like the first launch after a Play install or update. Results are
   in the Gradle output and in
   `benchmark/build/outputs/connected_android_test_additional_output/`, with a
   Perfetto trace per iteration.

Time to initial display is the first frame. Time to full display is when the
app calls `reportFullyDrawn()`, which `PostFeed` does once the first page of a
feed is on screen. Play's startup vitals use the same call.

To measure what the profiles in `profiles/` are worth on top of AndroidX's,
compare `startupBaselineProfile` against a run with them left out:

```sh
pnpm android:benchmark -Pbsky.baselineProfile=false
```

## Recording `profiles/app.txt`

```sh
pnpm android:baseline-profile
```

This builds the app without R8 (`-Pbsky.benchmark.minify=false`), since R8
renames the classes a profile has to name, runs `BaselineProfileGenerator` and
writes what it recorded to `profiles/app.txt` with `updateProfile.mjs`. That
marks every method hot, startup and post-startup (`HSP`), because Android 14
and older only compile methods marked hot at install, and ART marks few of the
methods it records as hot.

Re-run `pnpm android:benchmark` afterwards: compiling more code isn't free, and
a profile that covers too much can make startup slower.
