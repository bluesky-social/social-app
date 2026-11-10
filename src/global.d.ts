// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css'

declare module 'bidi-js' {
  type Bidi = {
    getBidiCharTypeName(character: string): string
  }

  export default function bidiFactory(): Bidi
}

/** Worklets 0.13.0 omits the advertised declaration for this entry point. */
declare module 'react-native-worklets/bundleMode/index.js' {
  import {type ConfigT} from '@expo/metro/metro-config'

  export function getBundleModeMetroConfig<T extends ConfigT>(config: T): T
}
