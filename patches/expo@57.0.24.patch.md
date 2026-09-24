# expo

## build/winter/runtime.native.d.ts

Type-check-only change; no runtime impact (only a `.d.ts` is modified).

Expo 57 added `import '../../types'` to `build/winter/runtime.native.d.ts`
(in Expo 54 the file was an empty `export {}`). That pulls
`expo/types/react-native-web.d.ts` into every native type-check pass via the
chain `expo/build/Expo.fx.d.ts -> ./winter -> runtime.native.d.ts ->
expo/types/index.d.ts`.

`react-native-web.d.ts` augments react-native's `TextStyle` with web-only
props, including `cursor?: string`, which conflicts with react-native 0.86's
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

## src/winter/fetch/RequestUtils.ts + fetch.ts - Blob body must not clobber an explicit Content-Type

Expo 57 installs `expo/fetch` as the global `fetch` on native
(`src/winter/runtime.native.ts`), replacing React Native's whatwg-fetch. When
the request body is a Blob, `normalizeBodyInitAsync` returned
`overriddenHeaders: [['Content-Type', blob.type]]`, which `fetch.ts` applied
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
that `fetch.ts` applies via `fillMissingHeaders` only for header keys the
caller did not set. This matches browser behavior.

Upstream: expo/expo#33405 introduced the override; the SDK 58 Request rewrite
(expo/expo#46630) is expected to make this spec-compliant, so re-evaluate on
the next SDK bump. Worth filing an issue against expo/expo referencing this.
