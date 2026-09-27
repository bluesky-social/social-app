import {StyleSheet, View} from 'react-native'
import {render} from '@testing-library/react-native'

import {space} from '#/alf/tokens'
import {Outer} from './index'

jest.mock('sonner-native', () => ({
  toast: {custom: jest.fn()},
  Toaster: () => null,
}))
jest.mock('#/alf', () => ({
  atoms: {
    px_xl: {paddingHorizontal: 20},
    w_full: {width: '100%'},
  },
}))
jest.mock('#/components/Toast/Toast', () => ({
  Outer: ({children}: {children: React.ReactNode}) => children,
  Icon: () => null,
  Text: () => null,
  ToastConfigProvider: () => null,
}))

it('caps and centers the native toast wrapper while retaining its phone gutters', () => {
  const result = render(<Outer>{null}</Outer>)
  const outer = result.UNSAFE_getByType(View)

  expect(StyleSheet.flatten(outer.props.style)).toEqual({
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 500 + space.xl * 2,
    alignSelf: 'center',
  })
})
