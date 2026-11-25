import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {AtmosphereScreen} from './index'

type ChildrenProps = {children?: React.ReactNode; testID?: string}

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  tokens: {borderRadius: {md: 12}},
  utils: {rgbToHex: () => '#000000'},
  web: (styles: object) => styles,
  useBreakpoints: () => ({gtPhone: true}),
  useTheme: () => ({
    atoms: {
      border_contrast_low: {},
      text: {color: '#111111'},
      text_inverted: {color: '#ffffff'},
      text_contrast_medium: {color: '#667788'},
      text_link: {color: '#0a7aff'},
      bg: {backgroundColor: '#ffffff'},
    },
    palette: {
      primary_100: '#CCE1FF',
      primary_600: '#0059D6',
      primary_500: '#006aff',
      primary_800: '#004299',
      positive_500: '#168a45',
    },
  }),
}))
let mockEnabled = true
const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    features: {
      enabled: () => mockEnabled,
      AtmosphereScreenEnable: 'AtmosphereScreenEnable',
    },
  }),
}))
jest.mock('@react-navigation/native', () => {
  const {useEffect} = jest.requireActual<typeof import('react')>('react')
  return {
    // Focused once on mount, like the real one with a stable callback
    useFocusEffect: (effect: React.EffectCallback) =>
      useEffect(effect, [effect]),
  }
})
jest.mock('#/view/screens/NotFound', () => {
  const {View} = jest.requireActual('react-native')
  return {NotFoundScreen: () => <View testID="notFoundScreen" />}
})
const mockOpenAboutDialog = jest.fn()
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpenAboutDialog}),
}))
jest.mock('#/screens/Atmosphere/components/AboutAtmosphereDialog', () => ({
  AboutAtmosphereDialog: () => null,
}))
jest.mock('#/components/icons/CircleInfo', () => ({
  CircleInfo_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} = jest.requireActual('react-native')
  return {
    Button: ({
      children,
      label,
      testID,
      onPress,
    }: {
      children?: React.ReactNode
      label: string
      testID?: string
      onPress?: () => void
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        testID={testID}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
  }
})
jest.mock('./AppsTab', () => {
  const {View} = jest.requireActual('react-native')
  return {AtmosphereAppsTab: () => <View testID="atmosphereAppsTab" />}
})
jest.mock('./CombinedTab', () => {
  const {View} = jest.requireActual('react-native')
  return {CombinedTab: () => <View testID="combinedTab" />}
})
jest.mock('#/view/com/pager/Pager', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Pager: ({
      children,
      initialPage = 0,
      renderTabBar,
      onTabPressed,
      onPageSelected,
      testID,
      ref,
    }: React.PropsWithChildren<{
      initialPage?: number
      onTabPressed?: (index: number) => void
      onPageSelected?: (index: number) => void
      renderTabBar: (props: {
        selectedPage: number
        onSelect: (index: number) => void
        dragProgress: {value: number}
        dragState: {value: 'idle'}
      }) => React.ReactNode
      testID?: string
      ref?: React.Ref<{setPage: (index: number) => void}>
    }>) => {
      const [selectedPage, setSelectedPage] = React.useState(initialPage)
      const setPage = (index: number) => {
        setSelectedPage(index)
        onPageSelected?.(index)
      }
      React.useImperativeHandle(ref, () => ({setPage}))
      const pages = React.Children.toArray(children)
      const onSelect = (index: number) => {
        onTabPressed?.(index)
        setPage(index)
      }
      return (
        <View testID={testID}>
          {renderTabBar({
            selectedPage,
            onSelect,
            dragProgress: {value: selectedPage},
            dragState: {value: 'idle'},
          })}
          {pages[selectedPage]}
        </View>
      )
    },
  }
})
jest.mock('#/view/com/pager/TabBar', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    TabBar: ({
      items,
      onSelect,
      selectedPage,
      testID,
    }: {
      items: string[]
      onSelect?: (index: number) => void
      selectedPage: number
      testID?: string
    }) => (
      <View testID={testID}>
        {items.map((item, index) => (
          <Pressable
            key={item}
            accessibilityHint=""
            accessibilityLabel={item}
            accessibilityRole="tab"
            accessibilityState={{selected: selectedPage === index}}
            onPress={() => onSelect?.(index)}>
            <Text>{item}</Text>
          </Pressable>
        ))}
      </View>
    ),
  }
})
jest.mock('#/components/Layout', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Screen: ({children, testID}: ChildrenProps) => (
      <View testID={testID}>{children}</View>
    ),
    Center: ({children}: ChildrenProps) => <View>{children}</View>,
    Header: {
      Outer: ({children}: ChildrenProps) => <>{children}</>,
      BackButton: () => null,
      Content: ({children}: ChildrenProps) => <>{children}</>,
      TitleText: ({children}: ChildrenProps) => <Text>{children}</Text>,
      Slot: ({children}: ChildrenProps) => <View>{children}</View>,
    },
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})

i18n.loadAndActivate({locale: 'en', messages: {}})

function renderScreen() {
  return render(
    <I18nProvider i18n={i18n}>
      <AtmosphereScreen
        route={{key: 'Atmosphere', name: 'Atmosphere'}}
        navigation={{} as never}
      />
    </I18nProvider>,
  )
}

beforeEach(() => {
  mockEnabled = true
  mockMetric.mockClear()
  mockOpenAboutDialog.mockClear()
})

describe('AtmosphereScreen', () => {
  it('renders not found when the feature gate is off', () => {
    mockEnabled = false
    const screen = renderScreen()

    expect(screen.getByTestId('notFoundScreen')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereScreen')).toBeNull()
    expect(mockMetric).not.toHaveBeenCalled()
  })

  it('defaults to Explore and switches between tabs', () => {
    const screen = renderScreen()

    expect(
      screen.getAllByRole('tab').map(tab => tab.props.accessibilityLabel),
    ).toEqual(['Explore', 'Apps'])
    expect(
      screen.getByRole('tab', {name: 'Explore'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByTestId('combinedTab')).toBeTruthy()

    fireEvent.press(screen.getByRole('tab', {name: 'Apps'}))
    expect(
      screen.getByRole('tab', {name: 'Apps'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByTestId('atmosphereAppsTab')).toBeTruthy()

    expect(
      mockMetric.mock.calls
        .filter(([event]) => event === 'atmosphere:tab:displayed')
        .map(([, payload]) => payload),
    ).toEqual([
      {tab: 'combined', reason: 'focus'},
      {tab: 'apps', previousTab: 'combined', reason: 'tap'},
    ])
  })

  it('opens the About Atmosphere dialog from the header info button', () => {
    const screen = renderScreen()

    fireEvent.press(screen.getByRole('button', {name: 'About the Atmosphere'}))
    expect(mockOpenAboutDialog).toHaveBeenCalledTimes(1)
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:about:open', {})
  })
})
