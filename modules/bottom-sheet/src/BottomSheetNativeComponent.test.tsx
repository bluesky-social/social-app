import {createRef} from 'react'
import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import {act, render} from '@testing-library/react-native'

import {
  type BottomSheetPresentationSizeChangeEvent,
  type BottomSheetViewProps,
} from './BottomSheet.types'
import {BottomSheetNativeComponent} from './BottomSheetNativeComponent'
import {BottomSheetOutlet, BottomSheetProvider} from './BottomSheetPortal'

type NativeViewProps = Pick<
  BottomSheetViewProps,
  'popover' | 'desiredContentHeight' | 'onPresentationSizeChange'
> & {
  children: React.ReactElement<{style: StyleProp<ViewStyle>}>
  containerBackgroundColor?: string
  maxHeight?: number
  style: StyleProp<ViewStyle>
}

const mockNativeViewProps = jest.fn<void, [NativeViewProps]>()

jest.mock('#/env', () => ({__esModule: true, IS_IPAD: false}))
jest.mock('expo-modules-core', () => {
  const actual =
    jest.requireActual<typeof import('expo-modules-core')>('expo-modules-core')
  const {View} = require('react-native')

  return {
    ...actual,
    requireNativeModule: (
      ...args: Parameters<typeof actual.requireNativeModule>
    ) =>
      args[0] === 'BottomSheet'
        ? {dismissAll: jest.fn()}
        : actual.requireNativeModule<unknown>(...args),
    requireNativeViewManager: (
      ...args: Parameters<typeof actual.requireNativeViewManager>
    ) =>
      args[0] === 'BottomSheet'
        ? function MockNativeView(props: NativeViewProps) {
            mockNativeViewProps(props)
            return <View testID="nativeBottomSheet">{props.children}</View>
          }
        : actual.requireNativeViewManager(...args),
  }
})

afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})

function renderOpenSheet(props: Omit<BottomSheetViewProps, 'children'>) {
  const ref = createRef<BottomSheetNativeComponent>()
  const result = render(
    <BottomSheetProvider>
      <BottomSheetNativeComponent ref={ref} {...props}>
        <View />
      </BottomSheetNativeComponent>
      <BottomSheetOutlet />
    </BottomSheetProvider>,
  )

  act(() => ref.current?.present())

  return {ref, result}
}

function lastNativeProps() {
  const props = mockNativeViewProps.mock.calls.at(-1)?.[0]
  if (!props) {
    throw new Error('Expected the native bottom sheet to render')
  }
  return props
}

it.each(['always', 'adaptive', 'never'] as const)(
  'keeps Android sheet backgrounds, sizing, and clipping in React with %s popover mode',
  popover => {
    jest.replaceProperty(Platform, 'OS', 'android')
    const backgroundColor = '#123456'
    const {result} = renderOpenSheet({
      backgroundColor,
      containerBackgroundColor: '#abcdef',
      cornerRadius: 12,
      maxHeight: 240,
      popover,
      desiredContentHeight: 400,
    })

    const nativeProps = lastNativeProps()
    const contentStyle = StyleSheet.flatten(nativeProps.children.props.style)

    expect(nativeProps.containerBackgroundColor).toBe(backgroundColor)
    expect(nativeProps.maxHeight).toBe(240)
    expect(StyleSheet.flatten(nativeProps.style)).toEqual({
      position: 'absolute',
    })
    expect(nativeProps).not.toHaveProperty('popover')
    expect(nativeProps).not.toHaveProperty('desiredContentHeight')
    expect(contentStyle).toMatchObject({
      flex: 1,
      backgroundColor,
      flexShrink: 1,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      overflow: 'hidden',
      maxHeight: 240,
    })
    expect(result.getByTestId('nativeBottomSheet')).toBeTruthy()
  },
)

it('defaults the native iOS fill to the content background color', () => {
  jest.replaceProperty(Platform, 'OS', 'ios')
  renderOpenSheet({
    backgroundColor: '#123456',
    cornerRadius: 12,
    maxHeight: 240,
  })

  expect(lastNativeProps().containerBackgroundColor).toBe('#123456')
  expect(lastNativeProps().popover).toBe('never')
  expect(
    StyleSheet.flatten(lastNativeProps().children.props.style),
  ).toMatchObject({backgroundColor: 'transparent'})
})

it('lets the iOS native presentation fill the surface while React content stays transparent', () => {
  jest.replaceProperty(Platform, 'OS', 'ios')
  const backgroundColor = '#123456'
  renderOpenSheet({
    backgroundColor,
    containerBackgroundColor: '#abcdef',
    cornerRadius: 12,
    maxHeight: 240,
  })

  const nativeProps = lastNativeProps()
  const contentStyle = StyleSheet.flatten(nativeProps.children.props.style)

  expect(nativeProps.containerBackgroundColor).toBe('#abcdef')
  expect(contentStyle).toMatchObject({backgroundColor: 'transparent'})

  renderOpenSheet({
    backgroundColor: '#fedcba',
    containerBackgroundColor: 'transparent',
    cornerRadius: 12,
    maxHeight: 240,
  })

  const updatedNativeProps = lastNativeProps()
  const updatedContentStyle = StyleSheet.flatten(
    updatedNativeProps.children.props.style,
  )

  expect(updatedNativeProps.containerBackgroundColor).toBe('transparent')
  expect(updatedContentStyle).toMatchObject({backgroundColor: 'transparent'})
})

it.each(['always', 'adaptive', 'never', undefined] as const)(
  'forwards iPhone %s presentation and constrains popover content to the native height',
  popover => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    renderOpenSheet({popover, desiredContentHeight: 400})

    const nativeProps = lastNativeProps()
    expect(nativeProps.popover).toBe(popover ?? 'never')
    expect(nativeProps.desiredContentHeight).toBe(400)

    act(() =>
      nativeProps.onPresentationSizeChange?.({
        nativeEvent: {
          width: 320,
          height: 180,
          isPopover: popover === 'always',
          safeAreaInsets: {top: 0, right: 0, bottom: 0, left: 0},
          bottomOffset: 0,
        },
      } as BottomSheetPresentationSizeChangeEvent),
    )

    const contentStyle = StyleSheet.flatten(
      lastNativeProps().children.props.style,
    )
    expect(contentStyle?.maxHeight).toBe(
      popover === 'always' || popover === 'adaptive' ? 180 : undefined,
    )
  },
)
