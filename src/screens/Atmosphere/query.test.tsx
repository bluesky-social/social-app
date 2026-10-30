import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import {useAtmosphereQuery} from './query'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useSession: jest.fn(),
}))

jest.unmock('multiformats/cid')

const timeline = app.bsky.unspecced.getAtmosphereTimeline
const cid = 'bafyreie5sviu7eeu3vf6n3lrlmqef2vdlwmgzd6zpolov56agdxtshdpda'

function profile(did: string) {
  return {did, handle: `${did.split(':').at(-1)}.test`}
}

function activity(did: string, view?: unknown, relatedActivity?: unknown[]) {
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityItem',
    record: {
      uri: `at://${did}/site.standard.graph.recommend/item`,
      cid,
      indexedAt: '2026-10-30T12:00:00.000Z',
    },
    collection: 'site.standard.graph.recommend',
    viewerState: {subscribed: false},
    view,
    relatedActivity,
  }
}

function page(feed: unknown[] = [], cursor?: string) {
  return timeline.$output.schema.parse({feed, cursor})
}

function setup(responses: unknown[]) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  const profileRequests: string[][] = []
  const client = {
    call: jest.fn(async (endpoint: unknown, params: {actors?: string[]}) => {
      if (endpoint === app.bsky.actor.getProfiles) {
        const actors = params.actors ?? []
        if (actors.length > 25) throw new Error('Too many profiles')
        profileRequests.push(actors)
        return {profiles: actors.map(profile)}
      }
      const response = await responses.shift()
      if (response instanceof Error) throw response
      return response
    }),
  }
  jest.mocked(useAppviewClient).mockReturnValue(client as never)
  jest.mocked(useSession).mockReturnValue({
    hasSession: true,
    currentAccount: {did: 'did:plc:viewer'},
  } as never)
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useAtmosphereQuery(), {wrapper})
  return {client, hook, queryClient, profileRequests}
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('retains loaded activity and its opaque cursor after a next-page error, then retries', async () => {
  const first = page([activity('did:plc:first')], 'opaque+/=cursor')
  const {client, hook} = setup([
    first,
    new Error('Next page unavailable'),
    page([activity('did:plc:second')]),
  ])
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  await act(() => hook.result.current.fetchNextPage())
  await waitFor(() =>
    expect(hook.result.current.isFetchNextPageError).toBe(true),
  )
  expect(hook.result.current.data?.pages[0].feed).toEqual(first.feed)
  expect(hook.result.current.data?.pages[0].cursor).toBe('opaque+/=cursor')

  await act(() => hook.result.current.fetchNextPage())
  await waitFor(() => expect(hook.result.current.hasNextPage).toBe(false))
  expect(hook.result.current.data?.pages.flatMap(p => p.feed)).toHaveLength(2)
  const calls = client.call.mock.calls.filter(
    ([endpoint]) => endpoint === timeline,
  )
  expect(calls.slice(1).map(([, params]) => params)).toEqual([
    {cursor: 'opaque+/=cursor'},
    {cursor: 'opaque+/=cursor'},
  ])
})

it('keeps an old account response out of the current account timeline', async () => {
  const {promise: pendingOld, resolve: finishOld} =
    Promise.withResolvers<unknown>()
  const {hook, queryClient} = setup([
    pendingOld,
    page([activity('did:plc:new')], 'new-viewer-cursor'),
  ])
  jest.mocked(useSession).mockReturnValue({
    hasSession: true,
    currentAccount: {did: 'did:plc:other-viewer'},
  } as never)
  hook.rerender({})
  expect(hook.result.current.data).toBeUndefined()
  await waitFor(() =>
    expect(hook.result.current.data?.pages[0].cursor).toBe('new-viewer-cursor'),
  )
  await act(async () => {
    finishOld(page([activity('did:plc:old')], 'old-viewer-cursor'))
    await pendingOld
  })
  expect(hook.result.current.data?.pages[0].actors['did:plc:new']).toEqual(
    profile('did:plc:new'),
  )
  expect(
    hook.result.current.data?.pages[0].actors['did:plc:old'],
  ).toBeUndefined()
  expect(
    queryClient.getQueriesData({queryKey: ['useAtmosphereQuery']}),
  ).toHaveLength(2)
})

it('hydrates interaction owners that are not the target article author, including related activity', async () => {
  const view = {
    $type: 'app.bsky.embed.external#viewArticle',
    uri: 'https://publication.test/article',
    title: 'An article',
    description: '',
    associatedProfiles: [profile('did:plc:author')],
  }
  const related = activity('did:plc:related', view)
  const {hook, profileRequests} = setup([
    page([activity('did:plc:recommender', view, [related])]),
  ])
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  expect(hook.result.current.data?.pages[0].actors).toEqual({
    'did:plc:author': profile('did:plc:author'),
    'did:plc:recommender': profile('did:plc:recommender'),
    'did:plc:related': profile('did:plc:related'),
  })
  expect(profileRequests.flat().sort()).toEqual([
    'did:plc:recommender',
    'did:plc:related',
  ])
})

it('hydrates large pages without exceeding the profile endpoint batch limit', async () => {
  const owners = Array.from({length: 51}, (_, index) => `did:plc:owner${index}`)
  const {hook, profileRequests} = setup([
    page(owners.map(did => activity(did))),
  ])
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  expect(Object.keys(hook.result.current.data!.pages[0].actors).sort()).toEqual(
    [...owners].sort(),
  )
  expect(profileRequests.map(batch => batch.length)).toEqual([25, 25, 1])
})

it('retains overflow and unknown entries and reuses the profiles provided with overflow', async () => {
  const overflow = {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityItemOverflow',
    count: 12,
    collection: 'social.grain.gallery',
    associatedProfiles: [profile('did:plc:author')],
  }
  const unknown = {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#futureEntry',
  }
  const response = page([activity('did:plc:author'), overflow, unknown], 'more')
  const {hook, profileRequests} = setup([response])
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  expect(hook.result.current.data?.pages[0].feed).toEqual(response.feed)
  expect(hook.result.current.hasNextPage).toBe(true)
  expect(profileRequests).toEqual([])
})

it('does not send authenticated timeline requests after logout', async () => {
  const {client, hook} = setup([page()])
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  const callsBeforeLogout = client.call.mock.calls.length
  jest.mocked(useSession).mockReturnValue({hasSession: false} as never)
  hook.rerender({})
  expect(hook.result.current.data).toBeUndefined()
  expect(hook.result.current.fetchStatus).toBe('idle')
  expect(client.call).toHaveBeenCalledTimes(callsBeforeLogout)
})
