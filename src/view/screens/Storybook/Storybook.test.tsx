import {act, fireEvent, render, screen} from '@testing-library/react-native'

import {type Pager} from '#/view/com/pager/Pager'
import Storybook from '#/view/screens/Storybook/Storybook'

const mockLoadedPages: string[] = []
const mockPagerHandlers: Pick<
  React.ComponentProps<typeof Pager>,
  'onTabPressed' | 'onPageSelected'
> = {}

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: {bg: {}}}),
  web: () => undefined,
}))
jest.mock('#/components/Layout', () => {
  const {View} = jest.requireActual('react-native')
  return {Content: View}
})
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/view/screens/Storybook/ThemeMenu', () => ({
  ThemeMenu: () => null,
}))
jest.mock('#/view/com/pager/TabBar', () => ({TabBar: () => null}))
jest.mock('#/view/com/pager/Pager', () => {
  const {View} = jest.requireActual('react-native')
  return {
    Pager: (props: React.ComponentProps<typeof Pager>) => {
      mockPagerHandlers.onTabPressed = props.onTabPressed
      mockPagerHandlers.onPageSelected = props.onPageSelected
      // Keep every page attached, like the native pager.
      return <View>{props.children}</View>
    },
  }
})
jest.mock('#/view/screens/Storybook/FoundationsPage', () => {
  const {View} = jest.requireActual('react-native')
  mockLoadedPages.push('Foundations')
  return {
    __esModule: true,
    default: () => <View testID="foundationsStory" />,
  }
})
jest.mock('#/view/screens/Storybook/ComponentsPage', () => {
  const {useState} = jest.requireActual<typeof import('react')>('react')
  const {Pressable, Text} = jest.requireActual('react-native')
  mockLoadedPages.push('Components')
  return {
    __esModule: true,
    default: function ComponentsStory() {
      const [count, setCount] = useState(0)
      return (
        <Pressable
          testID="componentsStory"
          accessibilityRole="button"
          accessibilityLabel="Increment count"
          accessibilityHint=""
          onPress={() => setCount(value => value + 1)}>
          <Text>Count: {count}</Text>
        </Pressable>
      )
    },
  }
})
jest.mock('#/view/screens/Storybook/OverlaysFeedbackPage', () => {
  const {View} = jest.requireActual('react-native')
  mockLoadedPages.push('Overlays & feedback')
  return {__esModule: true, default: () => <View testID="feedbackStory" />}
})
jest.mock('#/view/screens/Storybook/ScreensPatternsPage', () => {
  const {View} = jest.requireActual('react-native')
  mockLoadedPages.push('Screens & patterns')
  return {__esModule: true, default: () => <View testID="screensStory" />}
})
jest.mock('#/view/screens/Storybook/DeviceToolsPage', () => {
  mockLoadedPages.push('Device & tools')
  return {__esModule: true, default: () => null}
})

it('loads pages on first tab press or swipe and preserves visited story state', async () => {
  render(<Storybook />)
  await screen.findByTestId('foundationsStory')
  expect(mockLoadedPages).toEqual(['Foundations'])

  act(() => mockPagerHandlers.onTabPressed?.(1))
  act(() => mockPagerHandlers.onPageSelected?.(1))
  const counter = await screen.findByTestId('componentsStory')
  fireEvent.press(counter)
  expect(screen.getByText('Count: 1')).toBeTruthy()
  expect(mockLoadedPages).toEqual(['Foundations', 'Components'])

  // A swipe selects a page without pressing a tab first.
  act(() => mockPagerHandlers.onPageSelected?.(2))
  await screen.findByTestId('feedbackStory')
  expect(mockLoadedPages).toEqual([
    'Foundations',
    'Components',
    'Overlays & feedback',
  ])

  act(() => mockPagerHandlers.onPageSelected?.(3))
  await screen.findByTestId('screensStory')
  expect(mockLoadedPages).toEqual([
    'Foundations',
    'Components',
    'Overlays & feedback',
    'Screens & patterns',
  ])

  act(() => mockPagerHandlers.onPageSelected?.(1))
  expect(screen.getByText('Count: 1')).toBeTruthy()
  expect(mockLoadedPages).toEqual([
    'Foundations',
    'Components',
    'Overlays & feedback',
    'Screens & patterns',
  ])
})
