import {type PropsWithChildren} from 'react'
import {Platform} from 'react-native'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewClient} from '#/state/session'
import {
  article,
  gallery,
  manton,
  moderationOpts,
  NSID,
  recordUri,
} from '#/screens/Atmosphere/ActivityTab/__tests__/fixtures'
import {type ProfileMapper} from '#/screens/Atmosphere/data/mapProfiles'
import {app} from '#/lexicons'
import {
  findAllProfilesInQueryData,
  useAtmosphereRecommendedActivityQuery,
} from '../useAtmosphereRecommendedActivityQuery'

jest.mock('#/state/session', () => ({useAppviewClient: jest.fn()}))
jest.mock('#/state/preferences/languages', () => ({
  useLanguagePrefs: () => ({contentLanguages: mockLanguages}),
}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => mockModerationOpts,
}))
jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: () => ({data: undefined}),
}))
jest.mock('#/state/cache/profile-shadow', () => ({
  useApplyProfileShadow: () => mockApplyProfileShadow,
}))
jest.mock('#/env', () => ({IS_WEB: false}))
jest.mock('#/storage', () => ({device: {get: () => undefined}}))

let mockLanguages = ['en']
let mockModerationOpts: ModerationOpts | undefined
let mockApplyProfileShadow: ProfileMapper

function response(
  views: app.bsky.unspecced.getAtmosphereRecommendedActivity.Item['view'][] = [
    article(),
    gallery(),
  ],
): app.bsky.unspecced.getAtmosphereRecommendedActivity.$OutputBody {
  return {items: views.map(view => ({view})), recIdStr: '18446744073709551615'}
}

function setup() {
  const client = {did: 'did:plc:viewer', call: jest.fn()}
  jest.mocked(useAppviewClient).mockReturnValue(client as never)
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return {client, queryClient, wrapper}
}

beforeEach(() => {
  mockLanguages = ['en']
  mockModerationOpts = moderationOpts
  mockApplyProfileShadow = profile => profile
})

it('fetches one batch in recommendation order and keeps the raw response and recommendation ID', async () => {
  const {client, queryClient, wrapper} = setup()
  const data = response([gallery(), article()])
  client.call.mockResolvedValue(data)
  const {result} = renderHook(() => useAtmosphereRecommendedActivityQuery(), {
    wrapper,
  })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(client.call).toHaveBeenCalledWith(
    app.bsky.unspecced.getAtmosphereRecommendedActivity,
    {limit: 25, langs: ['en']},
    {
      signal: expect.any(AbortSignal),
      headers: {
        'Accept-Language': 'en',
        'x-atproto-bsky-platform': Platform.OS,
        'x-atproto-bsky-topics': '',
      },
    },
  )
  expect(result.current.data?.items.map(item => item.content.type)).toEqual([
    'gallery',
    'article',
  ])
  expect(result.current.data?.recIdStr).toBe(data.recIdStr)
  expect(queryClient.getQueryCache().getAll()[0].state.data).toBe(data)
})

it('waits for moderation preferences before fetching', async () => {
  const {client, wrapper} = setup()
  mockModerationOpts = undefined
  client.call.mockResolvedValue(response())
  const {result, rerender} = renderHook(
    () => useAtmosphereRecommendedActivityQuery(),
    {wrapper},
  )
  expect(client.call).not.toHaveBeenCalled()

  mockModerationOpts = moderationOpts
  rerender({})
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(client.call).toHaveBeenCalledTimes(1)
})

it('replaces the batch on refresh instead of appending', async () => {
  const {client, wrapper} = setup()
  client.call
    .mockResolvedValueOnce(response())
    .mockResolvedValueOnce(response([article('new.example.com')]))
  const {result} = renderHook(() => useAtmosphereRecommendedActivityQuery(), {
    wrapper,
  })
  await waitFor(() => expect(result.current.data?.items).toHaveLength(2))

  await act(async () => {
    await result.current.refetch()
  })
  await waitFor(() => expect(result.current.data?.items).toHaveLength(1))
  expect(result.current.data?.items[0].content.view.uri).toBe(
    'https://new.example.com/post',
  )
  expect(client.call).toHaveBeenCalledTimes(2)
})

it('uses separate caches when languages or the viewer change, including logged out', async () => {
  const {client, queryClient, wrapper} = setup()
  client.call.mockResolvedValue(response())
  const {result, rerender} = renderHook(
    () => useAtmosphereRecommendedActivityQuery(),
    {wrapper},
  )
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  mockLanguages = []
  rerender({})
  await waitFor(() => expect(client.call).toHaveBeenCalledTimes(2))
  expect(client.call).toHaveBeenLastCalledWith(
    app.bsky.unspecced.getAtmosphereRecommendedActivity,
    {limit: 25},
    expect.anything(),
  )

  jest.mocked(useAppviewClient).mockReturnValue({
    ...client,
    did: undefined,
  } as never)
  rerender({})
  await waitFor(() => expect(client.call).toHaveBeenCalledTimes(3))
  expect(queryClient.getQueryCache().getAll()).toHaveLength(3)
})

it('finds cached owners and publisher profiles, and re-filters shadows without a request', async () => {
  const {client, queryClient, wrapper} = setup()
  const owned = {
    associatedRefs: [{uri: recordUri(manton, NSID.document), cid: 'bafycid'}],
    associatedProfiles: [manton],
  }
  client.call.mockResolvedValue(
    response([
      article(undefined, {
        ...owned,
        publisher: {...article().publisher!, ...owned},
      }),
      {...gallery(), associatedRefs: owned.associatedRefs},
    ]),
  )
  const {result, rerender} = renderHook(
    () => useAtmosphereRecommendedActivityQuery(),
    {wrapper},
  )
  await waitFor(() => expect(result.current.data?.items).toHaveLength(2))
  expect([...findAllProfilesInQueryData(queryClient, manton.did)]).toHaveLength(
    3,
  )

  mockApplyProfileShadow = profile => ({
    ...profile,
    viewer: {...profile.viewer, muted: true},
  })
  rerender({})
  expect(result.current.data?.items).toEqual([])
  expect(client.call).toHaveBeenCalledTimes(1)

  mockApplyProfileShadow = profile => profile
  rerender({})
  expect(result.current.data?.items).toHaveLength(2)
})

it('skips unknown views and galleries without an image or author', async () => {
  const {client, wrapper} = setup()
  client.call.mockResolvedValue(
    response([
      {$type: 'future.example#view'} as never,
      {...gallery(), items: []},
      {...gallery(), associatedProfiles: []},
      article(),
    ]),
  )
  const {result} = renderHook(() => useAtmosphereRecommendedActivityQuery(), {
    wrapper,
  })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data?.items.map(item => item.content.type)).toEqual([
    'article',
  ])
})
