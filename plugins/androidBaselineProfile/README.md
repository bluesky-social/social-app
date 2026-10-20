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
- `profiles/app.txt` is recorded from our own cold start and first few
  flings through the feed, with `BaselineProfileGenerator`.
- `profiles/startup-prof.txt` is a
  [startup profile](https://developer.android.com/topic/performance/baselineprofiles/dex-layout-optimizations):
  only the code that runs until the feed's first page is on screen. R8 uses it
  at build time to put that code first in the primary dex file, so startup
  reads fewer pages, which helps even before anything has been compiled. AGP
  finds it by name and leaves it out of the Baseline Profile, so `app.txt`
  includes its rules too. Only R8 builds use it.

Rules that don't match anything in the app are ignored, so a stale profile only
loses coverage.

## Running the benchmarks

Needs a physical device on Android 13+ (API 33) to record a profile, since
recording on older versions needs root. Measuring works from Android 9. Gradle
runs on every connected device, so with an emulator open too, pick the phone
with `ANDROID_SERIAL=<serial from adb devices>`. Keep the device unlocked and
turn on Stay awake in Developer options
(`adb shell settings put global stay_on_while_plugged_in 7`), since an app
launched behind the lock screen never draws.

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

## Recording `profiles/app.txt` and `profiles/startup-prof.txt`

```sh
pnpm android:baseline-profile
pnpm android:baseline-profile:update
```

The first builds the app without R8 (`-Pbsky.benchmark.minify=false`), since
R8 renames the classes a profile has to name, and runs
`BaselineProfileGenerator`. The second writes what it recorded to
`profiles/` with `updateProfile.mjs`, which marks every method hot,
startup and post-startup (`HSP`), because Android 14 and older only compile
methods marked hot at install, and ART marks few of the methods it records as
hot.

Re-run `pnpm android:benchmark` afterwards: compiling more code isn't free, and
a profile that covers too much can make startup slower. That run also rebuilds
the app with R8 again.

Macrobenchmark refuses to run below 25% battery, among other checks. Recording
doesn't depend on timing, so it can skip a check with
`-Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.suppressErrors=LOW-BATTERY`.
Don't skip them for timing runs.
