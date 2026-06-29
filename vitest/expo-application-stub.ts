/*
 * Stub for expo-application. The real package transitively imports the `expo`
 * package, whose native winter runtime does bare CJS requires that don't
 * resolve under Vitest. #/env only reads nativeBuildVersion.
 *
 * Aliased in place of expo-application via resolve.alias in vitest.config.ts.
 */
export const nativeApplicationVersion = '1.0.0'
export const nativeBuildVersion = '1'
