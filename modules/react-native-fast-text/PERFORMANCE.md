# Fast Text performance and compatibility report

Measured on 25 September 2026 (UTC), in the `chiton` checkout of `social-app`.
The baseline app revision is `31613cdd193925b37419e1e313aae5c6b8cf1bc5`.
Links to the harness, raw data, and visual artifacts require the full source
checkout; those directories are intentionally excluded from the package tarball.

The main result is a **38-43% JS mount-time reduction for eligible iOS Typography
content**, with about half the layout-delivery time in this stress test.
Android's safe content lowering helps Lingui/fragments, but has no established
layout win. Wrapper-only cleanups are much smaller, and rich/emoji fallback paths
can regress. This is a selective fast path, not a universally faster renderer.

## What was built

`@bsky.app/react-native-fast-text` is a local, source-distributed library, integrated
into both app Typography implementations. It lowers safe text and simple Lingui
descriptors to the iOS native renderer from `react-native-plain-text@0.9.0`.
Android retains RN's native renderer while collapsing safe descriptor/fragment
children: the upstream native engine regressed the measured Android workload.
It retains
the original RN/UITextView path for everything it cannot safely represent.

The engineering contribution is the translation-aware compatibility/routing layer
and its design-system hook adapter, not a newly invented native text engine. A
plain `<Trans>` no longer has to remain a nested React subtree just to produce a
string. Rich translations, arbitrary components, selection, events, and imperative
refs are still handled by their original renderers.

## Measurement method

The [harness](example/BenchmarkApp.tsx) mounts 400 labels at a time. For each content
workload, it rotates and reverses renderer order, runs three warmup rounds, and
keeps twelve measured rounds per renderer. Before each sample it unmounts the
previous tree, waits 100 ms and one animation frame, then mounts a fresh keyed
tree. Fonts finish loading before the benchmark can start. Strings are identical
across renderers and contain a per-cell interpolation to avoid measuring one
repeated string only.

Three measurements are recorded from the same `performance.now()` start:

- **JS/commit delivery**: time to the root `useLayoutEffect`. This includes React
  rendering/commit work and scheduling; it is not a sampled CPU-self-time total.
- **Layout delivery**: time to the root View's native `onLayout` callback reaching
  JS. It includes scheduling and event delivery, not just Yoga measurement.
- **Settled**: two animation-frame callbacks after layout delivery. This is a
  scheduling diagnostic, not proof that every glyph has finished rasterizing.

These are **bulk-mount measurements**, not scrolling FPS, startup speed, memory
benchmarks, production traffic, or a full-feed benchmark. The 400-label workload
is intentionally a stress case. It does not establish the fraction of real app
text that qualifies for the fast path.

The Typography benchmark imports the real app component, ALF context/hooks, font
normalization, and font assets. Its original implementation and emoji helper are
frozen copies in [BaselineTypography.tsx](example/BaselineTypography.tsx) and
[BaselineEmoji.tsx](example/BaselineEmoji.tsx). Only account storage, logger,
platform flags, and constants that would pull in the navigator are shimmed. It is
an isolated real-component harness, not the entire signed-in Bluesky app.

The three Typography arms have equal wrapper depth:

- `typography-before`: original app implementation.
- `typography-wrapper`: changed wrapper with `deopt`, retaining UITextView/RN.
- `typography-fast`: changed wrapper with the fast renderer enabled.

The `deopt` arm measures the **net** wrapper changes including compatibility-router
overhead, not a perfect factorial attribution to each individual cleanup.

### Environment

- Host: Apple M4 Pro, 48 GiB RAM, macOS 27.0 (26A428).
- iOS: iPhone 17 simulator, iOS 26.5, arm64 Release build.
- Android: `Pixel_9_36` emulator, API 36, arm64-v8a Release APK.
- React 19.2.3, React Native 0.86.3, Fabric/bridgeless, Hermes, Expo 57.0.24.
- Lingui 5.9.2, native backend 0.9.0, UITextView 2.7.1.
- React Compiler enabled in the harness Babel configuration.
- Measurements use `development: false`; React/Hermes/native performance
  profilers are not recording during the final timing runs.

Argent controls installation, navigation, compatibility QA, and profiling. The
final timing flow only starts a deep link; completion is observed from the
host-side collector. No repeated accessibility-tree inspection is performed
during those runs. Earlier tree-polled and development/profiling experiments are
kept separately and must not be pooled with the final measurements.

### Statistics

[analyze.ts](example/analyze.ts) validates every renderer/workload/round combination,
excludes only tagged warmups, and keeps measured outliers. It reports per-run
results plus medians, linearly interpolated quartiles, ranges, and means. Reduction
is `100 * (1 - new median / original median)`; negative values are regressions.
Bootstrap intervals use 2,000 deterministic paired-round resamples, stratified by
run. These describe variation in these repeated emulator/simulator mounts, not
uncertainty across physical devices or the user population.
The intervals are exploratory and are not adjusted for multiple comparisons.

Frame scheduling makes layout/settled distributions multimodal. In particular, a
new wrapper can move work across a frame boundary without making the shared native
renderer faster. Treat apparent fallback layout wins cautiously and inspect the
JS measurement and quartiles as well.

The [measurement manifest](results/README.md) identifies every raw run, its
implementation/instrumentation status, and the exact files behind each final
summary. Preliminary and rejected experiments are retained, not silently pooled
or discarded.

## Final release results

All times below are milliseconds for mounting **400 labels**, not per-label
latencies. Positive reduction means faster; negative reduction means slower.
The original, cleanup/deopt, and integrated arms are measured in the same run.

### iOS Typography

Two independent final-strategy runs, 24 measured observations per cell:

| Workload                 | Original JS | Cleanup/deopt JS | Integrated JS | JS reduction | Original layout | Integrated layout |
| ------------------------ | ----------: | ---------------: | ------------: | -----------: | --------------: | ----------------: |
| String label             |       30.28 |            29.88 |         17.91 |        40.9% |           63.87 |             32.32 |
| Plain Lingui             |       33.80 |            34.07 |         20.20 |        40.2% |           66.55 |             33.27 |
| Fragment/interpolation   |       32.88 |            32.54 |         18.76 |        42.9% |           65.60 |             32.33 |
| Nested styled text       |       49.31 |            49.21 |         50.82 |        -3.0% |          100.42 |            101.48 |
| `emoji` flag, no emoji   |       31.86 |            30.43 |         19.71 |        38.1% |           64.74 |             32.62 |
| `emoji` flag, real emoji |       50.45 |            52.33 |         52.82 |        -4.7% |          112.43 |            114.55 |

Eligible labels show **38.1-42.9% lower JS mount time** and **49.4-50.7% lower
layout-delivery time**. For plain Lingui specifically, the JS-reduction bootstrap
interval is **38.5-41.3%**, and the layout interval is **29.7-50.7%**. These are
large, repeatable improvements in this simulator workload.

Nested styled text stays on the original renderer and costs **3.0% more JS**;
real-emoji text costs **4.7% more JS**. Both regressions' intervals exclude zero.
Preserving arbitrary rich content has a routing cost; it is not an accelerated
rich-text engine.

Full distributions and per-run results:
[iOS Typography summary](results/ios-typography-final-summary.json).

### Android Typography

Two independent final-strategy runs, 24 measured observations per cell:

| Workload                 | Original JS | Cleanup/deopt JS | Integrated JS | JS reduction | Original layout | Integrated layout |
| ------------------------ | ----------: | ---------------: | ------------: | -----------: | --------------: | ----------------: |
| String label             |      130.29 |           130.97 |        134.53 |        -3.3% |          312.95 |            378.75 |
| Plain Lingui             |      155.44 |           154.39 |        144.52 |         7.0% |          393.20 |            357.06 |
| Fragment/interpolation   |      160.18 |           164.89 |        132.41 |        17.3% |          398.93 |            358.19 |
| Nested styled text       |      267.73 |           276.28 |        279.97 |        -4.6% |          452.72 |            462.87 |
| `emoji` flag, no emoji   |      139.63 |           132.27 |        141.08 |        -1.0% |          379.23 |            299.26 |
| `emoji` flag, real emoji |      130.87 |           125.85 |        143.49 |        -9.6% |          371.80 |            362.76 |

The plain-Lingui JS reduction's bootstrap interval is **0.2% to 16.8%**; the
fragment reduction's is **12.2% to 23.4%**. All six layout-change intervals include
zero. Android layout delivery is particularly noisy, so these data do **not**
establish a native-layout speedup. Real-emoji JS is slower in these observations
(reduction interval **-16.0% to -1.7%**); plain-string and
nested JS intervals include zero. This is a content-specific optimization, not
an across-the-board Android improvement.

Full distributions and per-run results:
[Android Typography summary](results/android-typography-final-summary.json).

### Standalone library versus bare RN and upstream

This comparison uses the exported components, without ALF/Typography. The
upstream arm is the actual `react-native-plain-text` `Text` export, which falls
back to RN for the Lingui, fragment, and nested-element specimens. Its string
arm uses its native backend. Our safety/translation layer is not free.

#### iOS standalone Text (two runs, 24 observations per cell)

| Workload               | RN JS | Upstream JS | Fast JS | RN layout | Upstream layout | Fast layout |
| ---------------------- | ----: | ----------: | ------: | --------: | --------------: | ----------: |
| String label           | 12.68 |       12.79 |   15.87 |     51.37 |           41.75 |       44.44 |
| Plain Lingui           | 17.65 |       18.96 |   16.63 |     53.66 |           54.66 |       44.49 |
| Fragment/interpolation | 16.43 |       17.88 |   14.99 |     53.05 |           54.13 |       43.13 |
| Nested styled text     | 18.66 |       22.15 |   23.37 |     60.95 |           57.29 |       33.13 |

#### Android standalone Text (one run, 12 observations per cell)

| Workload               |  RN JS | Upstream JS | Fast JS | RN layout | Upstream layout | Fast layout |
| ---------------------- | -----: | ----------: | ------: | --------: | --------------: | ----------: |
| String label           |  87.42 |      104.83 |  106.41 |    302.96 |          274.39 |      215.25 |
| Plain Lingui           | 113.96 |      118.62 |   97.70 |    281.63 |          274.40 |      304.67 |
| Fragment/interpolation | 107.39 |      124.22 |   98.19 |    305.19 |          271.11 |      249.59 |
| Nested styled text     | 145.94 |      178.83 |  168.88 |    245.58 |          292.40 |      348.60 |

The standalone component is **not universally faster than bare RN Text**:
plain-string JS work and nested fallback JS work increase on both platforms.
The iOS fast string's layout-delivery median is lower, but the upstream
string-only path has less JS overhead than this compatibility layer.

The striking iOS nested layout result (**60.95 to 33.13 ms**) is not a native
rich-text speedup: this path still uses RN, and JS gets worse (**18.66 to
23.37 ms**). Its fast-layout interquartile range spans **32.32-59.96 ms**, showing
the frame-boundary/scheduling effect. Do not cite it as rich-text acceleration.

Prefer integrating the hook into an existing design-system wrapper, as this app
does, rather than mechanically replacing every direct RN Text import. For the
Android standalone comparison there is only one run; treat it as supporting
diagnostic data, not the same repetition strength as the Typography results.

Full summaries: [iOS](results/ios-library-final-summary.json) and
[Android](results/android-library-final-summary.json).

### Rejected Android native-engine experiment

The upstream TextView backend was initially tested on Android, then removed from
the shipping Android path. In the unprofiled, non-tree-polled experimental run,
original versus candidate JS medians were **126.33 vs 177.01 ms** for strings,
**163.49 vs 170.73 ms** for Lingui, and **147.59 vs 181.17 ms** for fragments.
Layout delivery also regressed in these cases. Correcting RTL/ellipsis defaults
fixed the visual issue, but did not make this backend a performance win here.

That rejected experiment is retained in
[its own summary](results/android-typography-first-summary.json) and is never
pooled with the final RN-backed implementation. Platform-specific routing is an
observed-result decision, not an assumption that one native engine wins everywhere.

## TypographyText investigation

The implementation removes a duplicate ALF/theme-context read, avoids native
tooltip/dataSet allocations, reuses an emoji-test regex without mutable global
`lastIndex`, and avoids `React.Children` traversal for primitive emoji-enabled
labels that contain no emoji. It retains font normalization and real emoji
splitting. No speculative `useMemo`, `useCallback`, custom React comparator, or
unbounded style cache was added.

The largest architectural change is calling `createTextRenderer`'s hook directly
inside the existing wrapper. Eligible labels bypass the UITextView/RN wrapper
chain without adding a new selector fiber. Both modern and legacy wrappers share
the custom-ancestor guard, including selectable UIKit text.

The wrapper-only arm is important: small allocation/context cleanups must not be
credited with the native fast path's whole improvement. Real-emoji strings still
split into styled runs on iOS and do not take that native fast path.

**Are there wins inside TypographyText itself?** Yes, but the measured net
cleanup win is narrow: iOS emoji-enabled labels with no actual emoji improve
from **31.86 to 30.43 ms JS (4.5%; interval 1.1-7.4%)** in the cleanup/deopt arm.
Plain labels, Lingui, fragments, and nested content have no established broad
cleanup-only win. Actual-emoji JS regresses **3.7%** in that arm. Android's
cleanup results are mixed as well. The context/allocation changes are smaller
than the main rendering-path change; this experiment cannot attribute a speedup
to each cleanup individually.

## Profiling evidence

Argent's React profiler was used in development to inspect component structure,
not to supply the release speed claims. Session `20260925-210639` captured 121
React commits, including 60 bulk mounts, and 69,816 profiler render records.

For a 400-label plain Lingui mount, RN produced 400 `Trans`, 400 `TransNoContext`,
400 `RenderChildren`, and 400 text-ancestor provider renders. The lowered path
produced none of those four groups. Locale and scalar-value updates are covered
by component tests and live device checks; removing those fibers does not remove
the locale subscription.

The [compact profile](results/react-profile-structure.json) maps all 60 bulk
mounts to the raw samples and keeps counts by component. The compressed original
records and a reproducible extraction script are linked from the manifest.
For example, measured Lingui commits 37 (RN) and 41 (fast) contain 2,016 versus
416 rendered records, including the identical harness/header work.

The native Instruments trace contained the benchmark process, but Argent's
aggregate analysis did not produce useful attributed hotspot findings. Its
zero-finding output is **not evidence of zero CPU cost, zero hangs, or no leaks**.
No native-memory or whole-app CPU reduction is claimed here. The profiler's
global compiler-detection flag also disagreed with individual `Forget(Cells)`
records; the Babel configuration is the source for the compiler-enabled setting.

## Compatibility findings

- Primitives, arrays, fragments, simple Lingui macros, locale changes, scalar
  updates, custom/default Lingui rendering, unknown hook components, fallback
  ancestry, refs, and web routing have automated coverage.
- On iOS and Android, live release checks exercise translated content, nested
  styling, press handlers, and native selection menus.
- The iOS development check confirmed `.measure` on a ref and a delivered
  `onTextLayout` callback. The fast path deliberately falls back for both APIs.
- The iOS style specimens had identical measured bounds across the twelve cases.
  Bare RN versus fast text differed on 1.13% of screen pixels; original Typography
  versus fast Typography differed on 1.48%, including the final-build repeat.
  These are screen-level comparisons with the status bar masked, not a text-only
  similarity score. Glyph/baseline raster differences
  remain; **the iOS fast path is not pixel-identical**.
- The experimental Android native backend's visual comparison found a real
  default-RTL-alignment difference and missing default ellipsizing. Explicit
  defaults fixed those behaviors (0.01% remaining pixel difference at the
  truncation edge), but release performance still regressed. The shipped Android
  strategy instead retains RN's renderer and its original alignment/ellipsis
  behavior; that native experiment is not the shipped implementation.
- RichText is compatible through fallback, not accelerated. Its selection,
  interactions, styled runs, and arbitrary React children are not flattened into
  a guessed string.

Visual artifacts:

- [iOS Typography layout measurements](results/visual-typography/layouts.json)
- [Final iOS baseline](results/visual-ios-final/baseline.png)
- [Final iOS current](results/visual-ios-final/current-5174c813.live.png)
- [Final Android baseline](results/visual-android-final/baseline.png)
- [Final Android current](results/visual-android-final/current-7f43e7fc.live.png)
- [Rejected native-Android experiment notes](results/visual-android-fixed/comparison.json)
- [Final iOS locale/counter observation](results/behavior-final/ios-locale.txt)
- [Final Android locale/counter observation](results/behavior-final/android-locale.txt)
- [iOS selection menu](results/behavior-final/ios-selection.png)
- [Android selection menu](results/behavior-final/android-selection.png)

The final RN-backed Android path matched the original Typography specimen screen
with **0% changed pixels**. This applies to that screen/device, not every possible
font/locale/prop combination. The raw artifacts are kept in the repository
checkout, not in the distributable library tarball.

## Rollout limits

The library is usable from the linked local package and is integrated in this
checkout. A native rebuild is required to add its backend. Use `deopt` for
individual compatibility-sensitive labels. Web retains the existing renderer.

Do not treat a simulator win as an established full-feed or physical-device win.
Before broad production rollout, check representative physical devices,
screen-reader navigation, larger system font scales, important fonts/languages,
and actual scrolling screens. The current tests cannot establish exhaustive
compatibility with every RN Text prop combination. The positive allowlists and
original-renderer fallback are the safety boundary.

For reproducible build/run commands, see [README](README.md#verification-and-reproduction).
The package is consumed from this source checkout; it has not been published to a
registry.

## Verification at handoff

- 28 focused tests passed (three suites), including Android content-only routing
  and web fallback behavior.
- Repository iOS, Android, and web typechecks and lint passed.
- iOS simulator Release build and Android arm64 Release APK built and ran.
- Web production export passed (413 modules); web keeps its original renderer.
- Final recorded Android and iOS compatibility flows each passed all eight steps.
- Package creation succeeded. The tarball contains five source files,
  `package.json`, README, performance report, and license; no tests, harness,
  raw results, native build products, or fonts are distributed in it.
- The final core library/integration Roast review returned verified
  `NO_FINDINGS` (run `20260925T214722Z-0bc6c2e9`). This is supporting review,
  not proof of exhaustive compatibility.
- A separate report/harness review (`20260925T221655Z-3d8c2088`) found two
  documentation issues: a reproduction output-name collision and an unclear
  checkout-only boundary. Both were corrected; it found no numerical or
  measurement-method defect in the selected review material.
