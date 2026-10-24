import {type PropsWithChildren} from 'react'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

import {useAppviewClient, useChatClient, useSession} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {app} from '#/lexicons'
import {composerStateToDraft} from './api'
import {
  fetchCompleteDraftInventory,
  reconcileCompleteInventory,
  saveDraft,
  useSaveDraftMutation,
} from './queries'
import {reconcileDraftMedia} from './reconciliation'
import * as storage from './storage'

jest.mock('#/analytics', () => ({useAnalytics: jest.fn()}))
jest.mock('#/analytics/identifiers', () => ({
  getDeviceId: jest.fn(() => 'device-id'),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useChatClient: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('./api', () => ({
  composerStateToDraft: jest.fn(),
  draftViewToSummary: jest.fn(),
}))

jest.mock('./logger', () => ({
  logger: {debug: jest.fn(), error: jest.fn(), warn: jest.fn()},
}))

jest.mock('./reconciliation', () => ({
  reconcileDraftMedia: jest.fn().mockResolvedValue({
    migrated: 0,
    retained: 0,
    deleted: 0,
  }),
}))

jest.mock('./storage', () => ({
  deleteMediaFromLocal: jest.fn(),
  ensureMediaCachePopulated: jest.fn(),
  getMediaMetadata: jest.fn(),
  listMediaArtifacts: jest.fn(),
  loadMediaFromLocal: jest.fn(),
  mediaExists: jest.fn(),
  saveMediaToLocal: jest.fn(),
  touchMediaMetadata: jest.fn(),
}))

const composerState = {} as ComposerState
const localRefPath = 'image:stable-local-ref'
const sourcePath = 'file:///cache/bsky-composer/source'
const accountDid = 'did:plc:alice'

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {gcTime: Infinity, retry: false},
      mutations: {gcTime: Infinity, retry: false},
    },
  })
  const appviewClient = {
    did: accountDid,
    call: jest.fn(method => {
      if (method === app.bsky.draft.getDrafts) {
        return Promise.resolve({drafts: []})
      }
      return Promise.resolve({id: 'draft-id'})
    }),
  }

  jest.mocked(useAppviewClient).mockReturnValue(appviewClient as never)
  jest.mocked(useChatClient).mockReturnValue({} as never)
  jest.mocked(useSession).mockReturnValue({
    currentAccount: {did: accountDid},
  } as never)
  jest.mocked(composerStateToDraft).mockResolvedValue({
    draft: {} as never,
    localRefPaths: new Map([[localRefPath, sourcePath]]),
  })
  jest.mocked(storage.ensureMediaCachePopulated).mockResolvedValue()
  jest.mocked(storage.mediaExists).mockReturnValue(false)
  jest.mocked(storage.saveMediaToLocal).mockResolvedValue()
  jest.mocked(storage.touchMediaMetadata).mockResolvedValue()

  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useSaveDraftMutation(), {wrapper})

  return {appviewClient, hook}
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(reconcileDraftMedia).mockResolvedValue({
    migrated: 0,
    retained: 0,
    deleted: 0,
  })
})

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

describe('useSaveDraftMutation', () => {
  test('persists and marks media pending before the server write', async () => {
    const {appviewClient, hook} = setup()

    await act(() => hook.result.current.mutateAsync({composerState}))

    expect(storage.saveMediaToLocal).toHaveBeenCalledWith(
      localRefPath,
      sourcePath,
      {
        accountDid,
        deviceId: 'device-id',
        state: 'pending',
      },
    )
    const createCallOrder = appviewClient.call.mock.invocationCallOrder.find(
      (_, index) =>
        appviewClient.call.mock.calls[index][0] === app.bsky.draft.createDraft,
    )!
    expect(
      jest.mocked(storage.saveMediaToLocal).mock.invocationCallOrder[0],
    ).toBeLessThan(createCallOrder)
  })

  test('does not write the server draft when durable persistence fails', async () => {
    setup()
    const error = new Error('source media is missing')
    jest.mocked(storage.saveMediaToLocal).mockRejectedValue(error)
    const client = {call: jest.fn()}

    await expect(
      saveDraft({
        client: client as never,
        chatClient: {} as never,
        accountDid,
        composerState,
      }),
    ).rejects.toBe(error)

    expect(client.call).not.toHaveBeenCalled()
  })

  test('reuses the same durable ref across retries', async () => {
    const {hook} = setup()
    jest
      .mocked(storage.mediaExists)
      .mockReturnValueOnce(false)
      .mockReturnValue(true)

    await act(() => hook.result.current.mutateAsync({composerState}))
    await act(() => hook.result.current.mutateAsync({composerState}))

    expect(composerStateToDraft).toHaveBeenCalledTimes(2)
    expect(storage.saveMediaToLocal).toHaveBeenCalledTimes(1)
    expect(storage.touchMediaMetadata).toHaveBeenCalledWith(
      localRefPath,
      expect.objectContaining({state: 'pending'}),
    )
  })

  test('leaves pending media intact after an ambiguous server failure', async () => {
    setup()
    const ambiguousError = new Error('Connection closed without a response')
    const events: string[] = []
    jest.mocked(storage.saveMediaToLocal).mockImplementation(() => {
      events.push('pending-media-persisted')
      return Promise.resolve()
    })
    const client = {
      call: jest.fn(() => {
        events.push('server-write')
        return Promise.reject(ambiguousError)
      }),
    }

    await expect(
      saveDraft({
        client: client as never,
        chatClient: {} as never,
        accountDid,
        composerState,
      }),
    ).rejects.toBe(ambiguousError)

    expect(events).toEqual(['pending-media-persisted', 'server-write'])
    expect(storage.deleteMediaFromLocal).not.toHaveBeenCalled()
    expect(storage.touchMediaMetadata).not.toHaveBeenCalledWith(
      localRefPath,
      expect.objectContaining({state: 'committed'}),
    )
  })

  test('does not report a successful server save as failed when metadata commit fails', async () => {
    const {hook} = setup()
    jest
      .mocked(storage.touchMediaMetadata)
      .mockRejectedValue(new Error('metadata write failed'))

    await expect(
      act(() => hook.result.current.mutateAsync({composerState})),
    ).resolves.toMatchObject({draftId: 'draft-id'})
  })
})

describe('complete draft inventory', () => {
  test('fetches every page before returning', async () => {
    const first = {id: 'first'} as never
    const second = {id: 'second'} as never
    const client = {
      call: jest
        .fn()
        .mockResolvedValueOnce({drafts: [first], cursor: 'next'})
        .mockResolvedValueOnce({drafts: [second]}),
    }

    await expect(fetchCompleteDraftInventory(client as never)).resolves.toEqual(
      [first, second],
    )
    expect(client.call).toHaveBeenCalledTimes(2)
  })

  test('does not inventory or sweep after the active account changes', async () => {
    const client = {did: 'did:plc:bob', call: jest.fn()}

    await expect(
      reconcileCompleteInventory(client as never, accountDid),
    ).rejects.toThrow('Account changed during draft inventory')
    expect(client.call).not.toHaveBeenCalled()
    expect(reconcileDraftMedia).not.toHaveBeenCalled()
  })

  test('does not reconcile after a partial inventory fails', async () => {
    const error = new Error('page two failed')
    const client = {
      did: accountDid,
      call: jest
        .fn()
        .mockResolvedValueOnce({drafts: [], cursor: 'next'})
        .mockRejectedValueOnce(error),
    }

    await expect(
      reconcileCompleteInventory(client as never, accountDid),
    ).rejects.toBe(error)
    expect(reconcileDraftMedia).not.toHaveBeenCalled()
  })
})
