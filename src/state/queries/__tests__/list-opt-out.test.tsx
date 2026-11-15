import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

import {until} from '#/lib/async/until'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {type app} from '#/lexicons'
import {RQKEY, useReferenceListOptOutMutation} from '../list'

jest.mock('#/lib/async/until', () => ({until: jest.fn()}))
jest.mock('#/lib/api', () => ({uploadBlob: jest.fn()}))
jest.mock('../feed', () => ({FEED_INFO_RQKEY_ROOT: 'feed-info'}))
jest.mock('../my-lists', () => ({invalidate: jest.fn()}))
jest.mock('../profile-lists', () => ({RQKEY: jest.fn()}))
jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  usePdsClient: jest.fn(),
  useSession: jest.fn(),
}))

const list = {
  uri: 'at://did:plc:creator/app.bsky.graph.list/list',
  viewer: {},
} as unknown as app.bsky.graph.defs.ListView
const createdOptOut =
  'at://did:plc:viewer/app.bsky.graph.referencelistoptout/created'

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {gcTime: Infinity, retry: false},
      mutations: {gcTime: Infinity, retry: false},
    },
  })
  const pdsClient = {
    assertDid: 'did:plc:viewer',
    create: jest.fn(),
    delete: jest.fn(),
  }
  jest.mocked(usePdsClient).mockReturnValue(pdsClient as never)
  jest.mocked(useAppviewClient).mockReturnValue({call: jest.fn()} as never)
  queryClient.setQueryData(RQKEY(list.uri), list)
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () =>
      useReferenceListOptOutMutation({
        list,
        onError: jest.fn(),
      }),
    {wrapper},
  )
  return {hook, pdsClient, queryClient}
}

beforeEach(() => jest.clearAllMocks())

describe('useReferenceListOptOutMutation', () => {
  it('creates an opt-out for the reference list', async () => {
    const {hook, pdsClient, queryClient} = setup()
    pdsClient.create.mockResolvedValue({uri: createdOptOut})
    jest.mocked(until).mockResolvedValue(false)

    await act(() =>
      hook.result.current.mutateAsync({referenceListOptOut: undefined}),
    )

    expect(pdsClient.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({subject: list.uri}),
    )
    expect(
      queryClient.getQueryData<app.bsky.graph.defs.ListView>(RQKEY(list.uri))
        ?.viewer?.referenceListOptOut,
    ).toBe(createdOptOut)
  })

  it('deletes the existing opt-out record when undoing', async () => {
    const {hook, pdsClient} = setup()
    pdsClient.delete.mockResolvedValue(undefined)
    jest.mocked(until).mockResolvedValue(true)

    await act(() =>
      hook.result.current.mutateAsync({referenceListOptOut: createdOptOut}),
    )

    expect(pdsClient.delete).toHaveBeenCalledWith(expect.anything(), {
      repo: 'did:plc:viewer',
      rkey: 'created',
    })
  })
})
