import {fireEvent, render, screen} from '@testing-library/react-native'

import {ExploreSectionHeader} from '../ExploreSectionHeader'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
  Trans: ({message}: {message: string}) => message,
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({palette: {primary_500: 'blue'}}),
}))
jest.mock('#/components/icons/Arrow', () => ({
  ArrowRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
    }: {
      children: (state: {hovered: boolean; pressed: boolean}) => React.ReactNode
      label: string
      onPress: () => void
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}>
        {children({hovered: false, pressed: false})}
      </Pressable>
    ),
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})

it('renders an accessible section heading without a see-more button', () => {
  render(<ExploreSectionHeader title="Featured articles" />)

  expect(screen.getByRole('header', {name: 'Featured articles'})).toBeTruthy()
  expect(screen.queryByText('See more')).toBeNull()
  expect(screen.queryByRole('button')).toBeNull()
})

it('calls seeMore.onPress from the see-more button', () => {
  const onPress = jest.fn()
  render(
    <ExploreSectionHeader
      title="Featured apps"
      seeMore={{label: 'See more apps', onPress}}
    />,
  )

  fireEvent.press(screen.getByRole('button', {name: 'See more apps'}))

  expect(onPress).toHaveBeenCalledTimes(1)
})
