import {useContext} from 'react'
import {
  FlatList,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
} from 'react-native'
import {render} from '@testing-library/react-native'

import {List} from '#/view/com/util/List'
import {SplitViewProvider} from '#/screens/Messages/components/splitView/context'
import * as Layout from '#/components/Layout'
import {ScrollbarOffsetContext} from '#/components/Layout/context'
import * as env from '#/env'

let mockGtMobile = true
let mockCenterColumnOffset = false
let mockIsWithinDialog = false

jest.mock('#/env', () => ({
  __esModule: true,
  IS_IOS: true,
  IS_IPAD: true,
  IS_WEB: false,
}))
jest.mock('#/alf', () => ({
  atoms: {
    w_full: {width: '100%'},
    mx_auto: {marginLeft: 'auto', marginRight: 'auto'},
    flex_grow: {flexGrow: 1},
    justify_center: {justifyContent: 'center'},
  },
  useBreakpoints: () => ({gtMobile: mockGtMobile}),
  useLayoutBreakpoints: () => ({
    centerColumnOffset: mockCenterColumnOffset,
  }),
  useTheme: () => ({
    scheme: 'light',
    palette: {contrast_100: '#ddd'},
    atoms: {
      text: {color: '#000'},
      border_contrast_low: {borderColor: '#ddd'},
    },
  }),
  web: () => undefined,
}))
jest.mock('react-native-reanimated', () => {
  const {FlatList, ScrollView} = require('react-native')
  return {
    __esModule: true,
    default: {FlatList, ScrollView},
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useAnimatedScrollHandler: () => jest.fn(),
    useSharedValue: (value: unknown) => ({get: () => value, set: jest.fn()}),
  }
})
jest.mock('react-native-worklets', () => ({scheduleOnRN: jest.fn()}))
jest.mock('@bsky.app/video', () => ({updateActiveVideoViewAsync: jest.fn()}))
jest.mock('#/lib/ScrollContext', () => ({useScrollHandlers: () => ({})}))
jest.mock('#/state/shell', () => ({
  useEnableMinimalShellModeForScreen: jest.fn(),
}))
jest.mock('#/state/shell/shell-layout', () => ({
  useShellLayout: () => ({footerHeight: {get: () => 0}}),
}))
jest.mock('#/components/Dialog/context', () => ({
  useDialogContext: () => ({isWithinDialog: mockIsWithinDialog}),
}))
jest.mock('#/components/Dialog', () => require('#/components/Dialog/context'))
jest.mock('#/components/Layout/Header', () => ({}))
jest.mock('#/components/Lightbox/state', () => ({
  useLightbox: () => ({activeLightbox: undefined}),
}))

beforeEach(() => {
  mockGtMobile = true
  mockCenterColumnOffset = false
  mockIsWithinDialog = false
})

afterEach(() => {
  jest.restoreAllMocks()
})

function OffsetProbe() {
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)
  return <Text>{String(isWithinOffsetView)}</Text>
}

type CommonScrollProps = Pick<
  ScrollViewProps,
  'style' | 'contentContainerStyle' | 'scrollIndicatorInsets'
>

function renderScrollable(
  component: 'List' | 'Content',
  props: CommonScrollProps = {},
  wrapper?: React.ComponentType<React.PropsWithChildren>,
) {
  const result = render(
    component === 'List' ? (
      <List data={['row']} renderItem={() => <OffsetProbe />} {...props} />
    ) : (
      <Layout.Content {...props}>
        <OffsetProbe />
      </Layout.Content>
    ),
    {wrapper},
  )
  return {
    ...result,
    viewport:
      component === 'List'
        ? result.UNSAFE_getByType(FlatList)
        : result.UNSAFE_getByType(ScrollView),
  }
}

describe.each(['List', 'Content'] as const)(
  '%s tablet scroll area',
  component => {
    it('constrains the inner column, not the swipeable viewport', () => {
      const {viewport, getByText} = renderScrollable(component, {
        style: {flex: 1},
        contentContainerStyle: {paddingBottom: 40, minHeight: 900},
      })

      const outerStyle = StyleSheet.flatten(viewport.props.style) ?? {}
      expect(outerStyle).not.toHaveProperty('maxWidth')
      expect(outerStyle).not.toHaveProperty('transform')
      expect(outerStyle).not.toHaveProperty('alignSelf')
      expect(outerStyle).toHaveProperty('width', '100%')
      expect(outerStyle).toHaveProperty('flex', 1)
      expect(
        StyleSheet.flatten(viewport.props.contentContainerStyle),
      ).toMatchObject({
        width: '100%',
        maxWidth: Layout.CENTER_COLUMN_WIDTH,
        alignSelf: 'center',
        transform: [{translateX: 0}],
        paddingBottom: 40,
        minHeight: 900,
      })
      expect(getByText('true')).toBeTruthy()
    })

    it('applies the tablet offset only to the inner column', () => {
      mockCenterColumnOffset = true
      const {viewport} = renderScrollable(component)

      expect(StyleSheet.flatten(viewport.props.style) ?? {}).not.toHaveProperty(
        'transform',
      )
      expect(
        StyleSheet.flatten(viewport.props.contentContainerStyle),
      ).toHaveProperty('transform', [{translateX: Layout.CENTER_COLUMN_OFFSET}])
    })

    it.each(['phone', 'compact', 'dialog', 'split view', 'centered parent'])(
      'preserves the existing layout inside a %s',
      context => {
        if (context === 'phone') jest.replaceProperty(env, 'IS_IPAD', false)
        if (context === 'compact') mockGtMobile = false
        if (context === 'dialog') mockIsWithinDialog = true

        function Wrapper({children}: React.PropsWithChildren) {
          if (context === 'split view') {
            return <SplitViewProvider side="left">{children}</SplitViewProvider>
          }
          if (context === 'centered parent') {
            return (
              <ScrollbarOffsetContext value={{isWithinOffsetView: true}}>
                {children}
              </ScrollbarOffsetContext>
            )
          }
          return children
        }

        const {viewport} = renderScrollable(
          component,
          {contentContainerStyle: {paddingBottom: 24}},
          Wrapper,
        )

        expect(
          StyleSheet.flatten(viewport.props.contentContainerStyle),
        ).toEqual({
          paddingBottom: 24,
        })
        expect(
          StyleSheet.flatten(viewport.props.style) ?? {},
        ).not.toHaveProperty('maxWidth')
      },
    )
  },
)

it('keeps full-bleed lists out of the centered column', () => {
  const result = render(
    <List
      data={[]}
      renderItem={() => null}
      disableTabletLayout
      contentContainerStyle={{paddingBottom: 24}}
    />,
  )
  const list = result.UNSAFE_getByType(FlatList)

  expect(StyleSheet.flatten(list.props.contentContainerStyle)).toEqual({
    paddingBottom: 24,
  })
})

it('keeps header spacing and scroll indicator overrides on the viewport', () => {
  const result = render(
    <List
      data={[]}
      renderItem={() => null}
      headerOffset={80}
      scrollIndicatorInsets={{bottom: 20}}
    />,
  )
  const list = result.UNSAFE_getByType(FlatList)

  expect(StyleSheet.flatten(list.props.style)).toHaveProperty('paddingTop', 80)
  expect(list.props.scrollIndicatorInsets).toEqual({
    top: 80,
    right: 1,
    bottom: 20,
  })
})

it('can opt out of the offset without narrowing the Content viewport', () => {
  mockCenterColumnOffset = true
  const result = render(<Layout.Content ignoreTabletLayoutOffset />)
  const scrollView = result.UNSAFE_getByType(ScrollView)

  expect(StyleSheet.flatten(scrollView.props.style)).not.toHaveProperty(
    'maxWidth',
  )
  expect(
    StyleSheet.flatten(scrollView.props.contentContainerStyle),
  ).toHaveProperty('transform', [{translateX: 0}])
})

it('centers short tablet pages vertically without adding native horizontal insets', () => {
  const result = render(
    <Layout.Content centerContent>
      <Text>Short content</Text>
    </Layout.Content>,
  )
  const scrollView = result.UNSAFE_getByType(ScrollView)

  expect(scrollView.props.centerContent).toBe(false)
  expect(
    StyleSheet.flatten(scrollView.props.contentContainerStyle),
  ).toMatchObject({
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: Layout.CENTER_COLUMN_WIDTH,
  })
})

it('preserves native content centering on compact layouts', () => {
  mockGtMobile = false
  const result = render(<Layout.Content centerContent />)
  const scrollView = result.UNSAFE_getByType(ScrollView)

  expect(scrollView.props.centerContent).toBe(true)
  expect(
    StyleSheet.flatten(scrollView.props.contentContainerStyle),
  ).not.toHaveProperty('justifyContent')
})
