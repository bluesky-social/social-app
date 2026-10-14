// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css'

declare module 'bidi-js' {
  type Bidi = {
    getBidiCharTypeName(character: string): string
  }

  export default function bidiFactory(): Bidi
}
