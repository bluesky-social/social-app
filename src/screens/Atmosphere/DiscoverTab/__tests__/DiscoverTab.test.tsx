import {Text} from 'react-native'
import {createDeferrable} from '@atproto/common-web'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {
  article,
  gallery,
} from '#/screens/Atmosphere/ActivityTab/__tests__/fixtures'
import {AtmosphereDiscoverTab} from '../index'
import {useAtmosphereRecommendedActivityQuery} from '../useAtmosphereRecommendedActivityQuery'

jest.mock('../useAtmosphereRecommendedActivityQuery', () => ({
  useAtmosphereRecommendedActivityQuery: jest.fn(),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({
    atoms: {text_contrast_medium: {}, border_contrast_low: {}},
  }),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/view/com/util/List', () => ({
  List: jest.requireActual<typeof import('react-native')>('react-native')
    .FlatList,
}))
jest.mock('#/view/com/util/error/ErrorMessage', () => {
  const {Button} = jest.requireActual('react-native')
  return {
    ErrorMessage: ({
      message,
      onPressTryAgain,
    }: {
      message: string
      onPressTryAgain: () => void
    }) => <Button title={message} onPress={onPressTryAgain} />,
  }
})
jest.mock(
  '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider',
  () => ({
    ActivityContentHider: ({children}: {children: React.ReactNode}) => children,
  }),
)
jest.mock('#/screens/Atmosphere/ActivityTab/components/ActivityRow', () => {
  const {Text} = jest.requireActual('react-native')
  return {
    ActivityContentCard: ({content}: {content: {view: {title: string}}}) => (
      <Text>{content.view.title}</Text>
    ),
  }
})

const refetch = jest.fn()
const mockQuery = jest.mocked(useAtmosphereRecommendedActivityQuery)
const errorMessage = 'Could not load recommendations. Please try again.'

function setQuery(
  result: Partial<ReturnType<typeof useAtmosphereRecommendedActivityQuery>>,
) {
  mockQuery.mockReturnValue({
    data: undefined,
    isError: false,
    refetch,
    ...result,
  } as never)
}

function renderTab() {
  return render(
    <I18nProvider i18n={i18n}>
      <AtmosphereDiscoverTab />
    </I18nProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

it('renders cards in order, with refresh but no load-more handler', async () => {
  setQuery({
    data: {
      items: [
        {content: {type: 'gallery', view: gallery()}, moderation: {}},
        {content: {type: 'article', view: article()}, moderation: {}},
      ],
      recIdStr: '123',
    } as never,
  })
  const refresh = createDeferrable()
  refetch.mockReturnValueOnce(refresh.complete)
  const screen = renderTab()
  const list = () => screen.getByTestId('atmosphereDiscoverTab')

  expect(screen.getAllByTestId('atmosphereDiscoverCard')).toHaveLength(2)
  expect(
    screen
      .getAllByTestId('atmosphereDiscoverCard')
      .map(card => card.findByType(Text).props.children as string),
  ).toEqual([gallery().title, article().title])
  expect(list().props.onEndReached).toBeUndefined()

  fireEvent(list(), 'refresh')
  expect(refetch).toHaveBeenCalledTimes(1)
  expect(list().props.refreshing).toBe(true)
  await act(async () => {
    refresh.resolve()
    await refresh.complete
  })
  expect(list().props.refreshing).toBe(false)
})

it('shows loading, retryable errors, and an empty state', () => {
  setQuery({})
  const screen = renderTab()
  expect(screen.getByLabelText('Loading recommendations')).toBeTruthy()

  setQuery({isError: true})
  screen.rerender(
    <I18nProvider i18n={i18n}>
      <AtmosphereDiscoverTab />
    </I18nProvider>,
  )
  fireEvent.press(screen.getByText(errorMessage))
  expect(refetch).toHaveBeenCalledTimes(1)
  expect(screen.queryByTestId('atmosphereDiscoverEmpty')).toBeNull()

  setQuery({data: {items: [], recIdStr: '123'}})
  screen.rerender(
    <I18nProvider i18n={i18n}>
      <AtmosphereDiscoverTab />
    </I18nProvider>,
  )
  expect(screen.getByTestId('atmosphereDiscoverEmpty')).toBeTruthy()
  expect(screen.queryByLabelText('Loading recommendations')).toBeNull()
})

it('keeps cached cards visible with a retry when refresh fails', () => {
  setQuery({
    isError: true,
    data: {
      items: [{content: {type: 'article', view: article()}, moderation: {}}],
      recIdStr: '123',
    } as never,
  })
  const screen = renderTab()
  expect(screen.getByText(article().title)).toBeTruthy()
  fireEvent.press(screen.getByText(errorMessage))
  expect(refetch).toHaveBeenCalledTimes(1)
})
