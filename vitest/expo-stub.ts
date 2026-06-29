/*
 * Stub for the bare `expo` package. Importing the real entry runs Expo's
 * "winter" runtime side-effect, which does bare CJS requires (./TextDecoder
 * etc) that don't resolve under Vitest's node environment. Node already
 * provides TextDecoder and friends, so we just need the named exports
 * test-reachable code pulls from `expo`.
 *
 * Aliased in place of `expo` via resolve.alias in vitest.config.ts.
 */
import {vi} from 'vitest'

export function requireNativeModule(moduleName: string) {
  if (moduleName === 'ExpoPlatformInfo') {
    return {getIsReducedMotionEnabled: () => false}
  }
  if (moduleName === 'BottomSheet') {
    return {dismissAll: () => {}}
  }
  return {}
}

export function requireOptionalNativeModule() {
  return null
}

export const requireNativeView = vi.fn(() => () => null)

export class NativeModule {}
export class SharedObject {}
export class SharedRef {}

export const useEvent = vi.fn()
export const useEventListener = vi.fn()
