/*
 * Stub for `react-native` used in unit tests. react-native's real entry is
 * Flow-typed and boots a native runtime, neither of which works (or is needed)
 * under Vitest's node environment. This is aliased in place of `react-native`
 * via resolve.alias in vitest.config.ts.
 *
 * Only the surface our test-reachable modules actually touch is implemented:
 * - Image.getSize (src/lib/media/manip.ts)
 * - NativeModules / Platform (@bsky.app/react-native-mmkv)
 * Extend as new transitive usages appear.
 */
import {vi} from 'vitest'

export const Image = {getSize: vi.fn()}

export const NativeModules: Record<string, unknown> = {}

export const Platform = {
  OS: 'ios' as const,
  select: <T>(o: {ios?: T; android?: T; native?: T; default?: T}): T =>
    (o.ios ?? o.native ?? o.default) as T,
}

export const Dimensions = {
  get: () => ({width: 390, height: 844, scale: 3, fontScale: 1}),
  addEventListener: () => ({remove() {}}),
}
