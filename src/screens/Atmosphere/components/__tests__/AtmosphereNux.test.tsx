import {createDeferrable} from '@atproto/common-web'
import {upsertNux} from '@bsky/sdk'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native'

import {Nux, useSaveNux} from '#/state/queries/nuxs'
import {type AppNux} from '#/state/queries/nuxs/definitions'
import {AtmosphereNux} from '#/screens/Atmosphere/components/AtmosphereNux'

jest.mock('#/state/queries/preferences', () => ({
  preferencesQueryKey: ['preferences'],
  usePreferencesQuery: () => ({
    data: {bskyAppState: {nuxs: mockNuxs}},
    isSuccess: true,
    isError: false,
  }),
}))
jest.mock('#/state/session', () => ({
  usePdsClient: () => ({call: mockCall}),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('expo-linear-gradient', () => ({LinearGradient: () => null}))
jest.mock('#/components/GradientFill', () => ({GradientFill: () => null}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpenDialog}),
}))
jest.mock('#/screens/Atmosphere/components/AboutAtmosphereDialog', () => ({
  AboutAtmosphereDialog: () => null,
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      onPress,
      testID,
      children,
    }: {
      label: string
      onPress: () => void
      testID?: string
      children: React.ReactNode
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
    ButtonText: Text,
  }
})

const mockCall = jest.fn()
const mockMetric = jest.fn()
const mockOpenDialog = jest.fn()
let mockNuxs: AppNux[]
let queryClient: QueryClient
const completedNux: AppNux = {
  id: Nux.AtmosphereNux,
  completed: true,
  data: undefined,
}

function Wrapper({children}: {children: React.ReactNode}) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </QueryClientProvider>
  )
}

function renderBanners() {
  return render(
    <>
      <AtmosphereNux />
      <AtmosphereNux />
      <AtmosphereNux />
    </>,
    {wrapper: Wrapper},
  )
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  i18n.loadAndActivate({locale: 'en', messages: {}})
  mockNuxs = []
  mockCall.mockResolvedValue(undefined)
  queryClient = new QueryClient({
    defaultOptions: {mutations: {retryDelay: 0}},
  })
})

afterEach(() => {
  queryClient.clear()
  jest.useRealTimers()
})

it('hides every banner while saving and refetching preferences', async () => {
  const save = createDeferrable()
  const refetch = createDeferrable()
  mockCall.mockReturnValue(save.complete)
  jest.spyOn(queryClient, 'invalidateQueries').mockReturnValue(refetch.complete)
  renderBanners()
  expect(screen.getAllByTestId('atmosphereNuxDismiss')).toHaveLength(3)

  fireEvent.press(screen.getAllByTestId('atmosphereNuxDismiss')[0])

  await waitFor(() => expect(screen.toJSON()).toBeNull())
  expect(mockCall).toHaveBeenCalledWith(upsertNux, completedNux)
  expect(mockMetric).toHaveBeenCalledWith('atmosphere:nux:bannerDismissed', {})

  await act(async () => {
    save.resolve()
    await save.complete
    await jest.runAllTimersAsync()
  })
  expect(screen.toJSON()).toBeNull()

  await act(async () => {
    refetch.resolve()
    await refetch.complete
    await jest.runAllTimersAsync()
  })
  expect(screen.toJSON()).toBeNull()
})

it('keeps every banner hidden through retries and a failed save', async () => {
  mockCall.mockRejectedValue(new Error('offline'))
  const {unmount} = renderBanners()

  fireEvent.press(screen.getAllByTestId('atmosphereNuxDismiss')[0])

  await act(async () => {
    await jest.runAllTimersAsync()
  })
  expect(screen.toJSON()).toBeNull()

  unmount()
  renderBanners()
  expect(screen.toJSON()).toBeNull()
})

it.each([
  {id: Nux.BookmarksAnnouncement, completed: true, data: undefined},
  {id: Nux.AtmosphereNux, completed: false, data: undefined},
])('does not hide for a save of $id with completed=$completed', async nux => {
  const banners = renderBanners()
  const {result} = renderHook(useSaveNux, {wrapper: Wrapper})

  await act(async () => {
    await result.current.mutateAsync(nux)
    await jest.runAllTimersAsync()
  })

  expect(banners.getAllByTestId('atmosphereNuxDismiss')).toHaveLength(3)
})

it('does not render the banner or its spacing for a saved dismissal', () => {
  mockNuxs = [completedNux]
  render(<AtmosphereNux style={{paddingTop: 16}} />, {wrapper: Wrapper})

  expect(screen.toJSON()).toBeNull()
})

it('still opens the about dialog without dismissing the banner', () => {
  render(<AtmosphereNux />, {wrapper: Wrapper})

  fireEvent.press(screen.getByTestId('atmosphereNuxLearnMore'))

  expect(mockOpenDialog).toHaveBeenCalledTimes(1)
  expect(mockMetric).toHaveBeenCalledWith('atmosphere:nux:learnMore', {})
  expect(mockCall).not.toHaveBeenCalled()
})
