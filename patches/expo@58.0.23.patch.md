# expo

## Patched files are the compiled `build/` output, not `src/`

Expo 57 published `main: "src/Expo.ts"`, so Metro bundled the TypeScript
sources and this patch edited `src/`. Expo 58 switched to
`main: "build/Expo.js"` plus an `exports` map whose `default` condition points
at `./build/*.js` (the `src/` files are only picked up under the
`expo-source` condition, which `@expo/metro-config` does not set; it even
resolves `expo/build/winter` directly). Every runtime hunk below therefore
edits `build/**/*.js`. Editing `src/` alone would be silently ignored.

## build/winter/runtime.native.d.ts

Type-check-only change; no runtime impact (only a `.d.ts` is modified).

Expo 57 added `import '../../types'` to `build/winter/runtime.native.d.ts`
(in Expo 54 the file was an empty `export {}`). Expo 58 keeps it (the file is
now `import './setupReactNativeEnvironment'; import '../../types';`). That
pulls `expo/types/react-native-web.d.ts` into every native type-check pass via
the chain `expo/build/Expo.fx.d.ts -> ./winter -> runtime.native.d.ts ->
expo/types/index.d.ts`.

`react-native-web.d.ts` augments react-native's `TextStyle` with web-only
props, including `cursor?: string`, which conflicts with react-native 0.88's
own `cursor?: CursorValue`. The merged declaration makes `TextStyle` no
longer assignable to `ViewStyle`, which in turn poisons `StyleSheet.create`
inference (values widen to `ViewStyle | TextStyle | ImageStyle`) and produced
~60 errors in `pnpm typecheck:ios` / `typecheck:android`.

The patch drops the `import '../../types'` line so the web-only augmentation
stays out of the native passes, matching Expo 54 behavior. The web pass is
unaffected: it resolves `runtime.d.ts` (not `.native`), which never had this
import.

Can be removed if Expo stops referencing `./react-native-web` from the types
loaded by the native winter runtime, or guards the augmentation to web.
Still unguarded on expo/expo `main` as of 2026-10-16.

## Resolve web async chunks against the entry bundle URL

Touches `build/async-require/buildUrlForBundle.js` and `package.json`
(`sideEffects`).

On web, Expo's chunk loader resolved Metro's root-relative async chunk paths
(`/static/_expo/static/js/web/<name>-<hash>.js`) against the page URL
(`getDevServer().url` is `location.origin + location.pathname`, in production
too). bskyweb serves the HTML from `bsky.app` but the exported bundle from
`STATIC_CDN_HOST` (`web-cdn.bsky.app`), so every `import()` requested its
chunk from `bsky.app` instead of the CDN the entry scripts came from. Webpack
handled this with `publicPath: 'auto'`; the Metro migration lost it.

- `buildUrlForBundle.js` resolves chunk paths against `getBundleUrl()` (Expo's
  existing `document.currentScript` capture of the entry script URL) when it
  is an http(s) URL, and falls back to the page URL otherwise (server
  rendering, tests). Absolute chunk URLs still pass through untouched. An
  empty `STATIC_CDN_HOST` keeps same-origin loading since the entry scripts
  are then served from the page origin. Only the web variant is patched;
  native uses `buildUrlForBundle.native.js`.
- `package.json` lists `./src/utils/getBundleUrl*.ts` and
  `./build/utils/getBundleUrl*.js` in `sideEffects` (mirroring how upstream
  lists both forms) so `EXPO_UNSTABLE_TREE_SHAKING` does not drop the bare
  `import '../utils/getBundleUrl'` in `winter/runtime.js`. Upstream `main` is
  still missing this.

The eager `import '../utils/getBundleUrl'` in `winter/runtime` that this patch
used to add is upstream since SDK 58 (expo/expo#49045), so it was dropped.

Upstream: proposed against `packages/expo`; drop this section once an SDK
ships it.
