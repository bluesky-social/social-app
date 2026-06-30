import {vi} from 'vitest'

/*
 * Note: `react-native` itself is stubbed via resolve.alias in
 * vitest.config.ts (-> vitest/react-native-stub.ts), not here.
 */

/*
 * expo-modules-core reads its native EventEmitter / NativeModule classes off
 * globalThis.expo, which only exists in a real Expo runtime. Several utility
 * modules pull it in transitively (via expo-application, expo-localization,
 * etc). We only need the handful of helpers tests actually touch.
 */
vi.mock('expo-modules-core', () => ({
  requireNativeModule: vi.fn((moduleName: string) => {
    if (moduleName === 'ExpoPlatformInfo') {
      return {getIsReducedMotionEnabled: () => false}
    }
    if (moduleName === 'BottomSheet') {
      return {dismissAll: () => {}}
    }
    return {}
  }),
  requireNativeViewManager: vi.fn(() => () => null),
  requireOptionalNativeModule: vi.fn(() => null),
  createPermissionHook: () => () => [true],
  NativeModule: class {},
  SharedObject: class {},
  SharedRef: class {},
  EventEmitter: class {},
  Platform: {
    OS: 'ios',
    isDOMAvailable: false,
    select: (o: Record<string, unknown>) => o.ios,
  },
}))
