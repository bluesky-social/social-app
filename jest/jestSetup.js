/* global jest */
import {configure} from '@testing-library/react-native'
import 'react-native-gesture-handler/jestSetup'

configure({asyncUtilTimeout: 5000})

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests()

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

jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn(),
}))

import {View as mockedView} from 'react-native'
jest.mock('react-native-tab-view', () => ({
  ...jest.requireActual('react-native-tab-view'),
  TabView: mockedView,
}))

jest.mock('@segment/analytics-react-native', () => ({
  createClient: () => ({
    add: jest.fn(),
  }),
  useAnalytics: () => ({
    track: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    group: jest.fn(),
    screen: jest.fn(),
    alias: jest.fn(),
    flush: jest.fn(),
  }),
}))

jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
)
