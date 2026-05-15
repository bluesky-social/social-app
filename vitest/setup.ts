import {EventEmitter} from 'node:events'

import {vi} from 'vitest'

// react-native ships Flow syntax in its index.js entry point, which Vitest's
// rolldown parser cannot handle. None of the tests exercise actual RN runtime
// behavior, so stub the whole module to satisfy transitive imports.
vi.mock('react-native', () => ({
  Platform: {OS: 'ios', select: (obj: any) => obj.ios ?? obj.default},
  StyleSheet: {create: (s: any) => s, flatten: (s: any) => s, hairlineWidth: 1},
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TextInput: 'TextInput',
  Modal: 'Modal',
  Image: 'Image',
  Pressable: 'Pressable',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  NativeModules: {},
  NativeEventEmitter: EventEmitter,
  AppState: {addEventListener: () => ({remove: () => {}}), currentState: 'active'},
  Linking: {openURL: vi.fn(), canOpenURL: vi.fn().mockResolvedValue(true)},
  Dimensions: {get: () => ({width: 375, height: 812}), addEventListener: () => ({remove: () => {}})},
  PixelRatio: {get: () => 2, getFontScale: () => 1},
  Keyboard: {addListener: () => ({remove: () => {}}), dismiss: () => {}},
  InteractionManager: {runAfterInteractions: (fn: () => void) => fn()},
  Animated: {View: 'AnimatedView', Value: class {}, timing: () => ({start: () => {}})},
  UIManager: {},
}))

vi.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

vi.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => ({
  __esModule: true,
  default: EventEmitter,
}))

vi.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}))

vi.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0}
  return {
    SafeAreaProvider: vi.fn().mockImplementation(({children}) => children),
    SafeAreaConsumer: vi
      .fn()
      .mockImplementation(({children}) => children(inset)),
    useSafeAreaInsets: vi.fn().mockImplementation(() => inset),
  }
})

vi.mock('expo-file-system/legacy', () => ({
  getInfoAsync: vi.fn().mockResolvedValue({exists: true, size: 100}),
  deleteAsync: vi.fn(),
  moveAsync: vi.fn().mockResolvedValue(undefined),
  createDownloadResumable: vi.fn(),
}))

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: vi.fn().mockResolvedValue({
    uri: 'file://resized-image',
  }),
  SaveFormat: {
    JPEG: 'jpeg',
    WEBP: 'webp',
  },
}))

vi.mock('expo-camera', () => ({
  Camera: {
    useCameraPermissions: vi.fn(() => [true]),
  },
}))

vi.mock('expo-media-library', () => ({
  __esModule: true,
  default: vi.fn(),
  usePermissions: vi.fn(() => [true]),
}))

vi.mock('@bsky.app/expo-guess-language', () => ({
  guessLanguageSync: vi
    .fn()
    .mockReturnValue([{language: 'en', confidence: 1}]),
  guessLanguageAsync: vi
    .fn()
    .mockResolvedValue([{language: 'en', confidence: 1}]),
}))

vi.mock('sentry-expo', () => ({
  init: () => vi.fn(),
  Native: {
    ReactNativeTracing: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
    ReactNavigationInstrumentation: vi.fn(),
  },
}))

vi.mock('crypto', () => ({}))

vi.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
}))

vi.mock('expo-modules-core', () => ({
  requireNativeModule: vi.fn().mockImplementation(moduleName => {
    if (moduleName === 'ExpoPlatformInfo') {
      return {
        getIsReducedMotionEnabled: () => false,
      }
    }
    if (moduleName === 'BottomSheet') {
      return {
        dismissAll: () => {},
      }
    }
  }),
  requireNativeViewManager: vi.fn().mockImplementation(_ => {
    return () => null
  }),
  createPermissionHook: () => () => [true],
}))

vi.mock('expo-localization', () => ({
  getLocales: () => [],
}))
