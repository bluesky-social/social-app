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

## build/winter/fetch/RequestUtils.js + fetch.js - Blob body must not clobber an explicit Content-Type

Expo installs `expo/fetch` as the global `fetch` on native
(`build/winter/runtime.native.js`), replacing React Native's whatwg-fetch.
When the request body is a Blob, `normalizeBodyInitAsync` returned
`overriddenHeaders: [['Content-Type', blob.type]]`, which `fetch.js` applied
*over* the caller's headers (introduced in expo/expo#33405). This is backwards
per the fetch spec: a blob's type is only a default, used when no Content-Type
was provided, and an empty type must contribute no header at all.

In this app it broke publishing posts with any image blob on Android. The
composer uploads via `agent.uploadBlob(blob, {encoding})`; `@atproto/xrpc`
sets `content-type: <mime>` explicitly, but the blob comes from an XHR
`file://` read of a `.bin`-renamed jpeg (the RN#27099 workaround in
`src/lib/api/upload-blob.ts`), for which Android's BlobModule returns an empty
mime. expo/fetch replaced the good header with the empty blob type and the PDS
rejected the upload with "Request encoding (Content-Type) required but not
provided". Also silently rewrote the intended mime on every other blob upload
(avatars, banners, caption files) even when the blob type was non-empty.

The patch splits body-derived headers into two channels: FormData keeps
`overriddenHeaders` (its boundary header must win), while the Blob branch
returns new `fallbackHeaders` (skipped entirely when `blob.type` is empty)
that `fetch.js` applies via `fillMissingHeaders` only for header keys the
caller did not set. This matches browser behavior.

Upstream: expo/expo#33405 introduced the override. The `Request` rewrite that
was expected to fix this (expo/expo#46630) is still an open, unmerged PR, and
neither SDK 58.0.19 nor `main` (as of 2026-10-16) changed this code, so re-evaluate on the next
SDK bump. Worth filing an issue against expo/expo referencing this. Setting
`EXPO_PUBLIC_USE_RN_FETCH=1` keeps React Native's fetch instead and would also
avoid the bug, at the cost of losing `expo/fetch` globally.

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
