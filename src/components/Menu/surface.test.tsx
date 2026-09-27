import {render} from '@testing-library/react-native'

import * as Dialog from '#/components/Dialog'
import * as Menu from '#/components/Menu'
import * as env from '#/env'

jest.mock('#/env', () => ({
  __esModule: true,
  IS_IOS: true,
  IS_ANDROID: false,
  IS_NATIVE: true,
  IS_IPAD: false,
  IS_LIQUID_GLASS: false,
}))
jest.mock('#/components/Dialog', () => {
  const {View} = require('react-native')

  return {
    Outer: jest.fn(({children}: React.PropsWithChildren) => (
      <View>{children}</View>
    )),
    Handle: () => null,
    ScrollableInner: ({children}: React.PropsWithChildren) => (
      <View>{children}</View>
    ),
    useDialogControl: () => ({open: jest.fn(), close: jest.fn()}),
  }
})
jest.mock('#/components/Button', () => ({
  Button: () => null,
  ButtonText: () => null,
}))
jest.mock('#/components/Typography', () => ({Text: () => null}))
jest.mock('#/alf', () => ({atoms: {}}))
jest.mock('@lingui/react/macro', () => ({
  useLingui: () => ({t: () => 'Menu'}),
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: () => 'Menu'}),
}))

afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})

describe('native menu surface', () => {
  it.each([
    {device: 'modern iPad', isIPad: true, liquidGlass: true, isIOS: true},
    {device: 'older iPad', isIPad: true, liquidGlass: false, isIOS: true},
    {device: 'modern iPhone', isIPad: false, liquidGlass: true, isIOS: true},
    {device: 'Android', isIPad: false, liquidGlass: false, isIOS: false},
  ])(
    'only overrides the default background for Liquid Glass iPads: $device',
    ({isIPad, liquidGlass, isIOS}) => {
      jest.replaceProperty(env, 'IS_IPAD', isIPad)
      jest.replaceProperty(env, 'IS_LIQUID_GLASS', liquidGlass)
      jest.replaceProperty(env, 'IS_IOS', isIOS)
      jest.replaceProperty(env, 'IS_ANDROID', !isIOS)

      render(
        <Menu.Root>
          <Menu.Outer />
        </Menu.Root>,
      )

      const {nativeOptions} = jest.mocked(Dialog.Outer).mock.calls[0][0]

      if (isIPad && liquidGlass) {
        expect(nativeOptions).toHaveProperty('backgroundColor', 'transparent')
      } else {
        expect(nativeOptions).not.toHaveProperty('backgroundColor')
      }
      expect(nativeOptions).toMatchObject({
        popover: isIOS,
        preventExpansion: true,
      })
    },
  )
})
