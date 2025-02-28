/* global jest */
import 'react-native-gesture-handler/jestSetup'
// IMPORTANT: this is what's used in the native runtime
import 'react-native-url-polyfill/auto'

import {configure} from '@testing-library/react-native'

configure({asyncUtilTimeout: 20000})

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const {EventEmitter} = require('events')
  return {
    __esModule: true,
    default: EventEmitter,
  }
})

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}))

jest.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0}
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({children}) => children),
    SafeAreaConsumer: jest
      .fn()
      .mockImplementation(({children}) => children(inset)),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
  }
})

jest.mock('rn-fetch-blob', () => ({
  config: jest.fn().mockReturnThis(),
  cancel: jest.fn(),
  fetch: jest.fn(),
}))

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({exists: true, size: 100}),
  deleteAsync: jest.fn(),
}))

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'file://resized-image',
  }),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}))

jest.mock('expo-camera', () => ({
  Camera: {
    useCameraPermissions: jest.fn(() => [true]),
  },
}))

jest.mock('expo-media-library', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
  usePermissions: jest.fn(() => [true]),
}))

jest.mock('lande', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn().mockReturnValue([['eng']]),
}))

jest.mock('sentry-expo', () => ({
  init: () => jest.fn(),
  Native: {
    ReactNativeTracing: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    ReactNavigationInstrumentation: jest.fn(),
  },
}))

jest.mock('crypto', () => ({}))

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
}))

jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn().mockImplementation(moduleName => {
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
  requireNativeViewManager: jest.fn().mockImplementation(moduleName => {
    return () => null
  }),
}))

jest.mock('expo-localization', () => ({
  getLocales: () => [],
}))

jest.mock('statsig-react-native-expo', () => ({
  Statsig: {
    initialize() {},
    initializeCalled() {
      return false
    },
  },
}))

jest.mock('../src/logger/bitdrift/lib', () => ({}))
jest.mock('../src/lib/statsig/statsig', () => ({}))
