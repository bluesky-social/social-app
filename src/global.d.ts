// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css'

declare module 'bidi-js' {
  type Bidi = {
    getBidiCharTypeName(character: string): string
  }

  export default function bidiFactory(): Bidi
}

/*
 * react-native-web doesn't export its list context resetter, which the web
 * Dialog needs for the same reason RN's Modal uses it on native. The native
 * passes check `.web.tsx` files too, so they need this. The web pass doesn't
 * include this file and gets the same declaration from
 * src/platform/misc.web-check.d.ts.
 */
declare module 'react-native-web/dist/vendor/react-native/VirtualizedList/VirtualizedListContext' {
  export function VirtualizedListContextResetter(props: {
    children: React.ReactNode
  }): React.ReactNode
}
