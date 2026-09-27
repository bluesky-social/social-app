import {Pressable, StyleSheet, Text, type ViewStyle} from 'react-native'
import {fireEvent, render} from '@testing-library/react-native'

import {Center} from '#/components/Layout'
import {PagerWithHeader} from './PagerWithHeader'

jest.mock('#/env', () => ({IS_IOS: true, IS_NATIVE: true}))
jest.mock('#/alf', () => ({
  useTheme: () => ({atoms: {bg: {backgroundColor: 'white'}}}),
}))
jest.mock('#/components/Layout', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Center: View}
})
jest.mock('react-native-reanimated', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: {View},
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useSharedValue: (value: unknown) => ({get: () => value}),
  }
})
jest.mock('react-native-worklets', () => ({scheduleOnUI: jest.fn()}))
jest.mock('#/view/com/pager/Pager', () => ({
  Pager: ({
    renderTabBar,
  }: {
    renderTabBar: (props: {onSelect: () => void}) => React.ReactNode
  }) => renderTabBar({onSelect: jest.fn()}),
}))
jest.mock('#/view/com/pager/TabBar', () => ({TabBar: () => null}))

function renderHeader(overflowInset?: number) {
  const onPress = jest.fn()
  const result = render(
    <PagerWithHeader
      items={['Posts']}
      isHeaderReady
      headerOverflowInset={overflowInset}
      renderHeader={() => (
        <Pressable onPress={onPress} accessibilityRole="button">
          <Text>Edit profile</Text>
        </Pressable>
      )}>
      {() => <Text>Post content</Text>}
    </PagerWithHeader>,
  )
  const clip = result.UNSAFE_getAllByType(Center).find(view => {
    const style = StyleSheet.flatten<ViewStyle>(view.props.style)
    return style?.overflow === 'hidden'
  })
  return {...result, clip, onPress}
}

it.each([744, 1366])(
  'lets touches pass through the empty %s-point clipping padding',
  overflowInset => {
    const {clip} = renderHeader(overflowInset)

    expect(clip).toBeDefined()
    expect(clip?.props.pointerEvents).toBe('box-none')
    expect(StyleSheet.flatten(clip?.props.style)).toEqual({
      overflow: 'hidden',
      marginVertical: -overflowInset,
      paddingVertical: overflowInset,
    })
  },
)

it('keeps the header controls interactive inside the clipping view', () => {
  const {getByText, onPress} = renderHeader(1366)

  fireEvent.press(getByText('Edit profile'))

  expect(onPress).toHaveBeenCalledTimes(1)
})

it('leaves ordinary headers without the expanded clipping view', () => {
  const {clip} = renderHeader()

  expect(clip).toBeUndefined()
})
