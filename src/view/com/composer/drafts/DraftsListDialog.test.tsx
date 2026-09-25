import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type DialogControlProps} from '#/components/Dialog'
import {DraftsListDialog} from './DraftsListDialog'
import {useDraftsQuery} from './state/queries'

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: jest.fn()}),
}))
jest.mock('./state/queries', () => ({
  useDraftsQuery: jest.fn(),
  useDeleteDraftMutation: () => ({mutate: jest.fn()}),
}))
jest.mock('./DraftItem', () => ({
  DraftItem: ({draft}: {draft: {id: string}}) => {
    const {Text} = require('react-native')
    return <Text>{draft.id}</Text>
  },
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({
  Loader: () => {
    const {View} = require('react-native')
    return <View testID="draftsLoading" />
  },
}))
jest.mock('#/alf', () => ({
  atoms: {},
  flatten:
    jest.requireActual<typeof import('react-native')>('react-native').StyleSheet
      .flatten,
  useTheme: () =>
    jest.requireActual<typeof import('#/alf/themes')>('#/alf/themes').themes
      .light,
  useBreakpoints: () => ({gtPhone: false, gtMobile: false, gtTablet: false}),
  select: (name: string, values: Record<string, unknown>) => values[name],
  web: () => undefined,
}))
jest.mock('#/components/Dialog', () => {
  const {View, Text, FlatList, Pressable} = require('react-native')
  return {
    Outer: ({
      children,
      onOpen,
    }: {
      children: React.ReactNode
      onOpen: () => void
    }) => (
      <View>
        <Pressable
          testID="openDrafts"
          accessibilityRole="button"
          onPress={onOpen}
        />
        {children}
      </View>
    ),
    Header: ({
      renderLeft,
      children,
    }: {
      renderLeft: () => React.ReactNode
      children: React.ReactNode
    }) => (
      <View>
        {renderLeft()}
        {children}
      </View>
    ),
    HeaderText: Text,
    InnerFlatList: FlatList,
  }
})
jest.mock('#/components/Lists', () => ({
  ListFooter: ({error, onRetry}: {error?: string; onRetry?: () => void}) => {
    const {Text, Pressable} = require('react-native')
    return error ? (
      <Pressable
        testID="draftsFooterRetry"
        accessibilityRole="button"
        onPress={onRetry}>
        <Text>{error}</Text>
      </Pressable>
    ) : null
  },
}))

const i18n = setupI18n({locale: 'en', messages: {en: {}}})
const control = {close: jest.fn()} as unknown as DialogControlProps

function queryState(overrides = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    isRefetching: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  }
}

function dialog() {
  return (
    <I18nProvider i18n={i18n}>
      <DraftsListDialog control={control} onSelectDraft={jest.fn()} />
    </I18nProvider>
  )
}

beforeEach(() => jest.clearAllMocks())

it('shows an error instead of an empty state and retries the list request', () => {
  const query = queryState({isError: true})
  jest.mocked(useDraftsQuery).mockReturnValue(query as never)
  const view = render(dialog())
  expect(screen.getByTestId('draftsLoadError')).toBeTruthy()
  expect(screen.queryByText('No drafts yet')).toBeNull()
  fireEvent.press(screen.getByTestId('draftsRetryButton'))
  expect(query.refetch).toHaveBeenCalledTimes(1)

  jest
    .mocked(useDraftsQuery)
    .mockReturnValue(queryState({isLoading: true, isFetching: true}) as never)
  view.rerender(dialog())
  expect(screen.getByTestId('draftsLoading')).toBeTruthy()

  jest
    .mocked(useDraftsQuery)
    .mockReturnValue(queryState({data: {pages: [{drafts: []}]}}) as never)
  view.rerender(dialog())
  expect(screen.queryByTestId('draftsLoadError')).toBeNull()
  expect(screen.getByText('No drafts yet')).toBeTruthy()
})

it.each([false, true])(
  'keeps loaded drafts and retries a failed page or refresh (next page: %s)',
  isFetchNextPageError => {
    const query = queryState({
      data: {pages: [{drafts: [{id: 'existing draft'}]}]},
      isError: true,
      isFetchNextPageError,
      hasNextPage: true,
    })
    jest.mocked(useDraftsQuery).mockReturnValue(query as never)
    render(dialog())
    expect(screen.getByText('existing draft')).toBeTruthy()
    fireEvent.press(screen.getByTestId('draftsFooterRetry'))
    expect(
      isFetchNextPageError ? query.fetchNextPage : query.refetch,
    ).toHaveBeenCalledTimes(1)
    expect(
      isFetchNextPageError ? query.refetch : query.fetchNextPage,
    ).not.toHaveBeenCalled()
  },
)

it('refreshes when the dialog is opened', () => {
  const query = queryState()
  jest.mocked(useDraftsQuery).mockReturnValue(query as never)
  render(dialog())
  fireEvent.press(screen.getByTestId('openDrafts'))
  expect(query.refetch).toHaveBeenCalledTimes(1)
})
