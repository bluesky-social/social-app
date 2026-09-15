import {type PropsWithChildren} from 'react'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {until} from '#/lib/async/until'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {type app} from '#/lexicons'
import {useReferenceListOptOutMutation} from '../starter-packs'

jest.mock('#/lib/async/until', () => ({
  until: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  usePdsClient: jest.fn(),
}))

const starterPack = {
  uri: 'at://did:plc:creator/app.bsky.graph.starterpack/pack',
  list: {
    uri: 'at://did:plc:creator/app.bsky.graph.list/list',
    viewer: {},
  },
} as unknown as app.bsky.graph.defs.StarterPackView

const queryKey = ['starter-pack', 'did:plc:creator', 'pack']
const createdOptOut =
  'at://did:plc:viewer/app.bsky.graph.referencelistoptout/created'
const indexedOptOut =
  'at://did:plc:viewer/app.bsky.graph.referencelistoptout/indexed'

function setup({onSuccess = jest.fn()} = {}) {
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
  const appviewClient = {call: jest.fn()}
  const onError = jest.fn()

  jest.mocked(usePdsClient).mockReturnValue(pdsClient as never)
  jest.mocked(useAppviewClient).mockReturnValue(appviewClient as never)
  queryClient.setQueryData(queryKey, starterPack)

  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () => useReferenceListOptOutMutation({starterPack, onError, onSuccess}),
    {wrapper},
  )

  return {appviewClient, hook, onError, onSuccess, pdsClient, queryClient}
}

beforeEach(() => {
  jest.clearAllMocks()
})

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

describe('useReferenceListOptOutMutation', () => {
  it('keeps the successful PDS write optimistic when AppView has not caught up', async () => {
    const {hook, onSuccess, pdsClient, queryClient} = setup()
    pdsClient.create.mockResolvedValue({uri: createdOptOut})
    jest.mocked(until).mockResolvedValue(false)

    await act(() =>
      hook.result.current.mutateAsync({referenceListOptOut: undefined}),
    )

    expect(pdsClient.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({subject: starterPack.list!.uri}),
    )
    expect(
      queryClient.getQueryData<app.bsky.graph.defs.StarterPackView>(queryKey)
        ?.list?.viewer?.referenceListOptOut,
    ).toBe(createdOptOut)
    expect(onSuccess).toHaveBeenCalledWith('optOut')
  })

  it('uses the indexed viewer-state URI when AppView reports a duplicate', async () => {
    const {hook, pdsClient, queryClient} = setup()
    pdsClient.create.mockResolvedValue({uri: createdOptOut})
    jest.mocked(until).mockImplementation((_retries, _delay, cond) =>
      Promise.resolve(
        cond(
          {
            starterPack: {
              list: {viewer: {referenceListOptOut: indexedOptOut}},
            },
          },
          undefined,
        ),
      ),
    )

    await act(() =>
      hook.result.current.mutateAsync({referenceListOptOut: undefined}),
    )

    expect(
      queryClient.getQueryData<app.bsky.graph.defs.StarterPackView>(queryKey)
        ?.list?.viewer?.referenceListOptOut,
    ).toBe(indexedOptOut)
  })

  it('deletes the viewer-state record URI when undoing', async () => {
    const {hook, onSuccess, pdsClient, queryClient} = setup()
    queryClient.setQueryData(queryKey, {
      ...starterPack,
      list: {
        ...starterPack.list,
        viewer: {referenceListOptOut: indexedOptOut},
      },
    })
    pdsClient.delete.mockResolvedValue(undefined)
    jest
      .mocked(until)
      .mockImplementation((_retries, _delay, cond) =>
        Promise.resolve(cond({starterPack: {list: {viewer: {}}}}, undefined)),
      )

    await act(() =>
      hook.result.current.mutateAsync({referenceListOptOut: indexedOptOut}),
    )

    expect(pdsClient.delete).toHaveBeenCalledWith(expect.anything(), {
      repo: 'did:plc:viewer',
      rkey: 'indexed',
    })
    expect(
      queryClient.getQueryData<app.bsky.graph.defs.StarterPackView>(queryKey)
        ?.list?.viewer?.referenceListOptOut,
    ).toBeUndefined()
    expect(onSuccess).toHaveBeenCalledWith('undo')
  })

  it('restores viewer state and surfaces PDS write failures', async () => {
    const {hook, onError, onSuccess, pdsClient, queryClient} = setup()
    const error = new Error('write failed')
    pdsClient.create.mockRejectedValue(error)

    await act(async () => {
      await expect(
        hook.result.current.mutateAsync({referenceListOptOut: undefined}),
      ).rejects.toThrow('write failed')
    })

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error))
    expect(onSuccess).not.toHaveBeenCalled()
    expect(
      queryClient.getQueryData<app.bsky.graph.defs.StarterPackView>(queryKey)
        ?.list?.viewer?.referenceListOptOut,
    ).toBeUndefined()
  })
})
