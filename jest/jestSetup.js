/* global jest */
import 'react-native-gesture-handler/jestSetup'

import {configure} from '@testing-library/react-native'

configure({asyncUtilTimeout: 20000})

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  // eslint-disable-next-line import-x/no-nodejs-modules
  const {EventEmitter} = require('events')
  return {
    __esModule: true,
    default: EventEmitter,
  }
})

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

jest.mock('react-native-mmkv', () => ({
  MMKV: class MMKV {
    _store = new Map()

    set(key, value) {
      this._store.set(key, value)
    }

    getString(key) {
      return this._store.get(key)
    }

    delete(key) {
      this._store.delete(key)
    }

    clearAll() {
      this._store.clear()
    }

    getAllKeys() {
      return Array.from(this._store.keys())
    }

    addOnValueChangedListener() {
      return {remove: () => {}}
    }
  },
}))

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({exists: true, size: 100}),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  createDownloadResumable: jest.fn(),
}))

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'file://resized-image',
  }),
  SaveFormat: {
    JPEG: 'jpeg',
    WEBP: 'webp',
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

// the real module reads its constants off the native module at import time
jest.mock('expo-secure-store', () => {
  const store = new Map()
  return {
    getItem: jest.fn(key => store.get(key) ?? null),
    setItem: jest.fn((key, value) => {
      store.set(key, value)
    }),
    AFTER_FIRST_UNLOCK: 0,
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
    ALWAYS: 2,
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 3,
    ALWAYS_THIS_DEVICE_ONLY: 4,
    WHEN_UNLOCKED: 5,
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  }
})

jest.mock('@bsky.app/expo-guess-language', () => ({
  guessLanguageSync: jest
    .fn()
    .mockReturnValue([{language: 'en', confidence: 1}]),
  guessLanguageAsync: jest
    .fn()
    .mockResolvedValue([{language: 'en', confidence: 1}]),
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
  requireNativeViewManager: jest.fn().mockImplementation(_ => {
    return () => null
  }),
  createPermissionHook: () => () => [true],
}))

jest.mock('expo-localization', () => ({
  getLocales: () => [],
}))
