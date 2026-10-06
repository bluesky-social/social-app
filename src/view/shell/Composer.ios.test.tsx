import {Modal} from 'react-native'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {fireEvent, render} from '@testing-library/react-native'

import * as env from '#/env'
import {Composer} from './Composer.ios'

const mockCancel = jest.fn()

jest.mock('#/env', () => ({
  __esModule: true,
  IS_IPAD: true,
  IS_LIQUID_GLASS: true,
}))
jest.mock('#/state/shell/composer', () => ({
  useComposerState: () => ({}),
}))
jest.mock('#/view/com/composer/Composer', () => ({
  ComposePost: () => null,
  useComposerCancelRef: () => ({current: {onPressCancel: mockCancel}}),
}))
jest.mock('#/alf', () => {
  const {createContext} = jest.requireActual<typeof import('react')>('react')
  return {
    atoms: {flex_1: {flex: 1}},
    BreakpointWidthContext: createContext<number | undefined>(undefined),
    useTheme: () => ({atoms: {bg: {backgroundColor: 'white'}}}),
  }
})
jest.mock('#/components/Tooltip', () => ({
  SheetCompatProvider: ({children}: React.PropsWithChildren) => children,
}))
jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: {pushStackEntry: jest.fn(), popStackEntry: jest.fn()},
}))

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

it('presents the iPad composer as a form sheet with its own safe area', () => {
  const result = render(<Composer />)
  const modal = result.UNSAFE_getByType(Modal)

  expect(modal.props.presentationStyle).toBe('formSheet')
  expect(modal.props.supportedOrientations).toEqual([
    'portrait',
    'portrait-upside-down',
    'landscape-left',
    'landscape-right',
  ])
  expect(result.UNSAFE_getByType(SafeAreaProvider)).toBeTruthy()
})

it('preserves the portrait page sheet on iPhone', () => {
  jest.replaceProperty(env, 'IS_IPAD', false)
  const result = render(<Composer />)
  const modal = result.UNSAFE_getByType(Modal)

  expect(modal.props.presentationStyle).toBe('pageSheet')
  expect(modal.props.supportedOrientations).toEqual(['portrait'])
  expect(result.UNSAFE_queryByType(SafeAreaProvider)).toBeNull()
})

it('keeps native dismissal routed through composer cancellation', () => {
  const result = render(<Composer />)
  fireEvent(result.UNSAFE_getByType(Modal), 'requestClose')

  expect(mockCancel).toHaveBeenCalledTimes(1)
})
