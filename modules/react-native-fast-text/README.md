# React Native Fast Text

A translation-aware fast path for React Native `Text`, with the original renderer
as its compatibility path. It is integrated into Bluesky's modern and legacy
Typography components in this checkout.

The iOS native engine is **react-native-plain-text 0.9.0** (UILabel). Android keeps
RN's native renderer and lowers safe translation/fragment subtrees: the upstream
TextView backend regressed the measured Android workload. This library adds safe
content lowering, Lingui subscriptions, strict
eligibility checks, custom-renderer ancestry protection, and a hook adapter for
design systems. It is not a new native text engine.

See [the performance report](PERFORMANCE.md) for observed results, raw data,
regressions, and the limits of the measurements. This is a compatible API with
fallbacks, not a promise that every text node is faster or pixel-identical.

## Use

```tsx
import {Text} from '@bsky.app/react-native-fast-text'
import {Trans} from '@lingui/react/macro'

<Text style={{fontSize: 16}}>A plain label</Text>

<Text>
  <Trans>Hello, {name}!</Trans>
</Text>

<Text>
  Normal <Text style={{fontWeight: '700'}}>bold</Text> text
</Text>

<Text deopt>Always use the original renderer for this label</Text>
```

Keep the normal Lingui `I18nProvider`. Macros need no changes. Simple translations
are resolved through the provider's public `i18n._` API and still subscribe to
locale/catalog changes. Styled translations and unknown components render
normally; they are never invoked manually to discover their output.

The public props are React Native `TextProps`, plus `deopt`. A ref intentionally
selects the original renderer so its imperative API is preserved.

### Installation

The app already declares `link:modules/react-native-fast-text` and the exact native
backend dependency. Run the repository's usual dependency install and native
rebuild. An OTA/JS-only update is insufficient when adding the backend for the
first time; it is not included in Expo Go.

This package is local, not published to a registry. To use it in another app,
pack this directory and install the resulting tarball together with
`react-native-plain-text@0.9.0`. The package ships TypeScript source for Metro.

Tested dependencies: React 19.2.3, React Native 0.86.3 with Fabric/Hermes, Expo
57.0.24, and Lingui 5.9.2. It requires React 19's conditional `use(context)` and
RN's `unstable_TextAncestorContext`. The native adapter uses upstream's unstable
mapping/native-component exports, so the backend version is pinned; upgrade it
only with compatibility tests and measurements.

## Eligibility and fallbacks

| Content or behavior                                                                   | Renderer                                                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Non-empty strings, numbers, arrays of text, transparent fragments                     | iOS native fast path when props/styles are supported; Android RN renderer              |
| Exact Lingui `Trans`, scalar string/number values, plain translated output            | iOS native fast path; Android RN with collapsed children; locale subscription retained |
| Nested styled text, links, arbitrary components, rich `Trans`                         | Original renderer, original children                                                   |
| Selectable text, refs, press/responder handlers, `onTextLayout`                       | Original renderer                                                                      |
| Custom Lingui render/component/defaultComponent, non-scalar values, translated markup | Original renderer                                                                      |
| Unsupported props/styles, `deopt`, empty content                                      | Original renderer                                                                      |
| Web                                                                                   | Original renderer; the native backend is not imported                                  |

The iOS native path's positive allowlists are in [supported.ts](src/supported.ts). New or
unknown React Native features fall back by default. Examples include accessibility
aliases that RN normalizes, `disabled`, automatic font fitting, text decoration
color/style, and capitalization with differing native semantics.

Android always keeps the fallback's native renderer and original props. It only
collapses safe object children into text; events, refs, and otherwise unsupported
native-label styles therefore need not disable that content-only optimization.

Fast labels are never inserted inside RN text ancestors. Custom fallback trees
also get a shared ancestry guard. This is important for Bluesky's selectable
`UITextView`, which has its own text ancestry context.

RichText compatibility is preserved through fallback; **RichText acceleration is
not implemented**. A fallback has a small routing cost. The report includes it.

## Design-system integration

`createText(Fallback, options)` creates a component. The fallback must implement
RN-like text semantics for the normalized props: its extra transformations cannot
run on a fast path that deliberately bypasses it.

`createTextRenderer(Fallback, options)` creates a hook for an existing wrapper:

```tsx
const useText = createTextRenderer(ExistingNativeText)

function TypographyText(props: TextProps) {
  const normalized = normalizeTypographyProps(props)
  return useText(normalized)
}
```

Create the hook once at module scope and call it on every render. This avoids an
extra selector component/fiber. React Compiler can still optimize the wrapper;
no manual memoization or custom comparator is required.

Options:

- `ignoredProps`: custom fallback-only props to omit from the native label. Never
  list props that change the fast label's appearance or behavior.
- `needsAncestorGuard`: defaults to guarding custom fallback trees. Override only
  when the fallback's ancestry behavior is known. Bluesky omits the extra guard
  when `UITextView` delegates to RN Text, and keeps it for selectable UIKit text.

The app's shared adapter is
[`src/components/TypographyText/index.tsx`](../../src/components/TypographyText/index.tsx).
Both the modern and legacy wrappers use it so mixed nested trees remain safe.

## Rendering caveats

UILabel and RN's attributed-text renderer have small raster/baseline differences.
The iOS comparison retained the measured specimen bounds, but was not
pixel-identical. Use `deopt` on typography-sensitive surfaces if the visual
difference is unacceptable. Keep the existing `emoji` prop on app Typography;
its real-emoji font splitting continues through the original renderer.

Physical-device performance, exhaustive screen-reader behavior, every font and
language, and full-feed scrolling are not established by a bulk-mount benchmark.
Review the report's rollout limits before a broad production rollout.

## Verification and reproduction

This section requires the matching **full social-app source checkout**, not an
installed/tarball copy of this package. The harness, raw results, app integration,
and fonts are deliberately not distributed in the tarball. Links to `example/`,
`results/`, and app source are checkout-relative; read this README in
`modules/react-native-fast-text/` in the source checkout to follow them.

From that repository's root:

```sh
pnpm --dir modules/react-native-fast-text test
pnpm --dir modules/react-native-fast-text lint
pnpm typecheck
pnpm --dir modules/react-native-fast-text prettier
```

The [example](example/) is an isolated Expo harness that imports the real app
Typography, ALF hooks, fonts, and normalization code. Its baseline files are frozen
copies of the original implementations. Account storage, logger, and platform
constants are shimmed so the app navigator and account services are not loaded.

Start the local collector in a separate terminal:

```sh
pnpm --dir modules/react-native-fast-text/example collect
```

Create native projects with `expo prebuild --platform ios --no-install` or
`--platform android --no-install` from the example directory. Install Pods for
iOS. Build the `FastTextBenchmark` scheme in Release for an iOS simulator, or run
`./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a` from the
generated Android directory. The APK uses development signing and is only a test
artifact. For Android, reverse the collector port with
`adb -s <serial> reverse tcp:8124 tcp:8124`.

Use Argent `list-devices`, `reinstall-app`, and `open-url` to install and run the
benchmark app (`app.bsky.fasttext.benchmark`). Do not attach a debugger/profiler or
run builds during timing collection. Saved flows are in
[`example/.argent/flows`](example/.argent/flows/).
For timings, use the `*-start` flows (or the deep links directly) and wait for a new
file from the collector before the next action. The older tree-polled flows are
diagnostic experiments: repeated accessibility inspection can perturb a benchmark.

- `fasttextbench://run?group=library`: RN, upstream, and this library.
- `fasttextbench://run?group=typography`: original, wrapper/deopt, and integrated.
- `fasttextbench://specimens?renderer=typography-fast&page=behavior`: compatibility QA.
- `fasttextbench://specimens?renderer=typography-before&page=styles`: visual baseline.

Each run posts raw samples to `results/`. Warmups are kept and tagged. Analyze
explicit result files without mixing development/profiling and release data:

```sh
pnpm --dir modules/react-native-fast-text analyze --release \
  results/<run-1>.json results/<run-2>.json \
  --output results/reproduced-final-summary.json
```

The script validates sample counts and reports medians, quartiles, ranges,
per-run results, and paired-round bootstrap intervals. It groups different
platforms/configurations separately and discards no measured outliers.
Use the [measurement manifest](results/README.md) to choose input files: raw
collector data does not itself distinguish earlier implementation strategies.

The archived React profiler evidence can be re-extracted with:

```sh
pnpm --dir modules/react-native-fast-text profile:extract \
  results/react-profile-structure.commits.json.gz \
  results/2026-09-25T21-06-05.922Z.json \
  results/react-profile-structure.json
```

## Attribution

[react-native-plain-text](https://github.com/mdjastrzebski/react-native-plain-text)
by Maciej Jastrzębski and contributors supplies the native renderer and prop
mapping. It remains a separately installed dependency with its own license.
This compatibility layer is MIT-licensed; see [LICENSE](LICENSE).
