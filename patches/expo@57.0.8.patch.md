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
