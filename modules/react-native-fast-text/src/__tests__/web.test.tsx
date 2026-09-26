import {Text as RNText} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {createTextRenderer, Text} from '../index.web'

jest.mock('react-native-plain-text', () => {
  throw new Error('The web entry must not load a native backend')
})

it('keeps the web renderer and strips the native opt-out prop', () => {
  render(
    <Text deopt testID="web">
      Hello <RNText>web</RNText>
    </Text>,
  )
  expect(screen.getByText('Hello web')).toBeTruthy()
  expect(screen.getByTestId('web').props.deopt).toBeUndefined()
})

it('keeps the custom web fallback and its custom props', () => {
  function Custom({
    children,
    label,
  }: {
    children?: React.ReactNode
    label?: string
  }) {
    return <RNText testID={label}>{children}</RNText>
  }
  const useText = createTextRenderer(Custom, {ignoredProps: ['label']})
  function Wrapper() {
    return useText({label: 'custom', children: 'web content'})
  }
  render(<Wrapper />)
  expect(screen.getByTestId('custom')).toBeTruthy()
})
