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
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    features: {
      enabled: () => mockEnabled,
      AtmosphereScreenEnable: 'AtmosphereScreenEnable',
    },
  }),
}))
jest.mock('#/view/screens/NotFound', () => {
  const {View} = jest.requireActual('react-native')
  return {NotFoundScreen: () => <View testID="notFoundScreen" />}
})
jest.mock('./ExploreTab', () => {
  const {Pressable, Text, View} = jest.requireActual('react-native')
  return {
    AtmosphereExploreTab: ({
      onPressSeeMoreApps,
    }: {
      onPressSeeMoreApps?: () => void
    }) => (
      <View testID="atmosphereExploreTab">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See more apps"
          accessibilityHint=""
          onPress={onPressSeeMoreApps}>
          <Text>See more</Text>
        </Pressable>
      </View>
    ),
  }
})
jest.mock('./ActivityTab', () => {
  const {View} = jest.requireActual('react-native')
  return {ActivityTab: () => <View testID="activityTab" />}
})
jest.mock('./AppsTab', () => {
  const {View} = jest.requireActual('react-native')
  return {AtmosphereAppsTab: () => <View testID="atmosphereAppsTab" />}
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
      testID,
      ref,
    }: React.PropsWithChildren<{
      initialPage?: number
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
      React.useImperativeHandle(ref, () => ({setPage: setSelectedPage}))
      const pages = React.Children.toArray(children)
      const onSelect = (index: number) => setSelectedPage(index)
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
      Slot: () => null,
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
})

describe('AtmosphereScreen', () => {
  it('renders not found when the feature gate is off', () => {
    mockEnabled = false
    const screen = renderScreen()

    expect(screen.getByTestId('notFoundScreen')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereScreen')).toBeNull()
  })

  it('defaults to Following and switches between tabs', () => {
    const screen = renderScreen()

    expect(
      screen.getAllByRole('tab').map(tab => tab.props.accessibilityLabel),
    ).toEqual(['Following', 'Explore', 'Apps'])
    expect(
      screen.getByRole('tab', {name: 'Following'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByTestId('activityTab')).toBeTruthy()

    fireEvent.press(screen.getByRole('tab', {name: 'Explore'}))
    expect(screen.getByTestId('atmosphereExploreTab')).toBeTruthy()
    expect(screen.queryByTestId('activityTab')).toBeNull()

    // Explore's "See more apps" jumps to the Apps tab.
    fireEvent.press(screen.getByRole('button', {name: 'See more apps'}))
    expect(
      screen.getByRole('tab', {name: 'Apps'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByTestId('atmosphereAppsTab')).toBeTruthy()
  })
})
