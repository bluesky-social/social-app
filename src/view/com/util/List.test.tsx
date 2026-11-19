import {type ListViewToken, View} from 'react-native'
import {act, render} from '@testing-library/react-native'

import {List} from '#/view/com/util/List'
import {List as WebList} from '#/view/com/util/List.web'

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: jest.fn()}),
}))
jest.mock('#/alf', () => ({
  useBreakpoints: () => ({gtMobile: false}),
  useTheme: () => ({atoms: {text: {color: '#000'}}, palette: {}}),
  web: (style: unknown) => style,
}))
jest.mock('#/lib/ScrollContext', () => ({useScrollHandlers: () => ({})}))
jest.mock('#/features/verticalBar', () => ({
  useHorizontalSafeAreaInsets: () => ({left: 0, right: 0}),
}))
jest.mock('#/screens/Messages/components/splitView/context', () => ({
  useIsWithinSplitView: () => ({isWithinSplitView: false}),
}))
jest.mock('#/components/Dialog/context', () => ({
  useDialogContext: () => ({isWithinDialog: false}),
}))
jest.mock('#/components/Layout', () => ({
  Center:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('#/components/Lightbox/state', () => ({
  useLightboxIsOpenSharedValue: () => undefined,
}))
jest.mock('#/view/com/util/Views', () => ({
  FlatList_INTERNAL:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('@bsky.app/video', () => ({updateActiveVideoViewAsync: jest.fn()}))
jest.mock('react-native-worklets', () => ({scheduleOnRN: jest.fn()}))
jest.mock('react-native-reanimated', () => ({
  useAnimatedProps: (callback: () => unknown) => callback(),
  useAnimatedScrollHandler: () => undefined,
  useSharedValue: (value: unknown) => ({get: () => value}),
}))

const items = [{key: 'first'}, {key: 'second'}]

it('forwards native view-token indices, including unavailable indices for legacy consumers', () => {
  const seen: unknown[] = []
  const onItemSeen = jest.fn((item: unknown) => seen.push(item))
  const screen = render(
    <List testID="list" data={items} onItemSeen={onItemSeen} />,
  )
  const {onViewableItemsChanged} = screen.getByTestId('list').props as {
    onViewableItemsChanged: (info: {
      viewableItems: ListViewToken[]
      changed: ListViewToken[]
    }) => void
  }
  const changed: ListViewToken[] = [
    {item: items[0], key: 'first', index: 0, isViewable: false},
    {item: items[1], key: 'second', index: 1, isViewable: true},
    {item: items[0], key: 'first', index: undefined, isViewable: true},
  ]
  act(() => onViewableItemsChanged({viewableItems: [], changed}))

  expect(onItemSeen.mock.calls).toEqual([
    [items[1], 1],
    [items[0], undefined],
  ])
  expect(seen).toEqual([items[1], items[0]])
})

it('forwards web row indices after the visibility dwell time', () => {
  jest.useFakeTimers()
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'IntersectionObserver',
  )
  type Entries = {isIntersecting: boolean}[]
  const rowCallbacks: ((entries: Entries) => void)[] = []
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: jest.fn((callback: (entries: Entries) => void) => ({
      observe(node: {props: {dataSet?: {listRow?: string}}}) {
        if (node.props.dataSet?.listRow !== undefined) {
          rowCallbacks.push(callback)
        }
      },
      unobserve: jest.fn(),
    })),
  })

  try {
    const onItemSeen = jest.fn()
    const screen = render(
      <WebList
        data={items}
        keyExtractor={item => item.key}
        renderItem={() => <View />}
        onItemSeen={onItemSeen}
      />,
    )
    expect(rowCallbacks).toHaveLength(2)
    act(() => {
      for (const callback of rowCallbacks) callback([{isIntersecting: true}])
      jest.advanceTimersByTime(499)
    })
    expect(onItemSeen).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(1))
    expect(onItemSeen.mock.calls).toEqual([
      [items[0], 0],
      [items[1], 1],
    ])
    screen.unmount()
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'IntersectionObserver', descriptor)
    } else {
      Reflect.deleteProperty(globalThis, 'IntersectionObserver')
    }
    jest.useRealTimers()
  }
})
