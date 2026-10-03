import {render} from '@testing-library/react-native'

import * as env from '#/env'
import {RepostButton} from './RepostButton'

jest.mock('#/env', () => ({__esModule: true, IS_IPAD: false}))
jest.mock('#/components/PostControls/RepostButtonMenu', () => {
  const {View} = require('react-native')

  return {
    RepostButtonMenu: ({longPressToQuote}: {longPressToQuote?: boolean}) => (
      <View
        testID={longPressToQuote ? 'ipad-repost-menu' : 'web-repost-menu'}
      />
    ),
  }
})
jest.mock('#/components/Dialog', () => {
  const {View} = require('react-native')

  return {
    Outer: () => <View testID="phone-repost-dialog" />,
    Handle: () => null,
    useDialogControl: () => ({open: jest.fn(), close: jest.fn()}),
  }
})
jest.mock('#/components/PostControls/PostControlButton', () => {
  const {View} = require('react-native')

  return {
    PostControlButton: () => <View />,
    PostControlButtonIcon: () => null,
    PostControlButtonText: () => null,
  }
})
jest.mock('#/components/PostControls/util', () => ({
  useFormatPostStatCount: () => String,
}))
jest.mock('#/state/session', () => ({
  useRequireAuth: () => (callback: () => void) => callback(),
}))
jest.mock('#/alf', () => ({
  atoms: {},
  useTheme: () => ({palette: {positive_500: 'green'}, atoms: {}}),
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: () => ''}),
}))

const props = {
  isReposted: false,
  repostCount: 1,
  onRepost: jest.fn(),
  onQuote: jest.fn(),
  embeddingDisabled: false,
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('native repost button selection', () => {
  it('uses the menu on iPad', () => {
    jest.replaceProperty(env, 'IS_IPAD', true)

    const screen = render(<RepostButton {...props} />)

    expect(screen.getByTestId('ipad-repost-menu')).toBeTruthy()
    expect(screen.queryByTestId('phone-repost-dialog')).toBeNull()
  })

  it('keeps the dialog on iPhone and other non-iPad devices', () => {
    jest.replaceProperty(env, 'IS_IPAD', false)

    const screen = render(<RepostButton {...props} />)

    expect(screen.getByTestId('phone-repost-dialog')).toBeTruthy()
    expect(screen.queryByTestId('ipad-repost-menu')).toBeNull()
  })
})
