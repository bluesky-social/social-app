import {type PropsWithChildren} from 'react'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

import {useAppviewClient, useChatClient} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {composerStateToDraft} from './api'
import {useSaveDraftMutation} from './queries'
import * as storage from './storage'

jest.mock('#/analytics', () => ({
  useAnalytics: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useChatClient: jest.fn(),
}))

jest.mock('./api', () => ({
  composerStateToDraft: jest.fn(),
  draftViewToSummary: jest.fn(),
}))

jest.mock('./logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('./storage', () => ({
  deleteMediaFromLocal: jest.fn(),
  ensureMediaCachePopulated: jest.fn(),
  loadMediaFromLocal: jest.fn(),
  mediaExists: jest.fn(),
  saveMediaToLocal: jest.fn(),
}))

const composerState = {} as ComposerState
const localRefPath = 'image:local-ref'
const sourcePath = 'file:///cache/bsky-composer/source'

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {gcTime: Infinity, retry: false},
      mutations: {gcTime: Infinity, retry: false},
    },
  })
  const appviewClient = {call: jest.fn().mockResolvedValue({id: 'draft-id'})}

  jest.mocked(useAppviewClient).mockReturnValue(appviewClient as never)
  jest.mocked(useChatClient).mockReturnValue({} as never)
  jest.mocked(composerStateToDraft).mockResolvedValue({
    draft: {} as never,
    localRefPaths: new Map([[localRefPath, sourcePath]]),
  })
  jest.mocked(storage.ensureMediaCachePopulated).mockResolvedValue()
  jest.mocked(storage.mediaExists).mockReturnValue(false)
  jest.mocked(storage.saveMediaToLocal).mockResolvedValue()

  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useSaveDraftMutation(), {wrapper})

  return {appviewClient, hook}
}

beforeEach(() => {
  jest.clearAllMocks()
})

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

describe('useSaveDraftMutation', () => {
  it('persists new media before creating the server draft', async () => {
    const {appviewClient, hook} = setup()

    await act(() => hook.result.current.mutateAsync({composerState}))

    expect(storage.ensureMediaCachePopulated).toHaveBeenCalledTimes(1)
    expect(storage.saveMediaToLocal).toHaveBeenCalledWith(
      localRefPath,
      sourcePath,
    )
    expect(
      jest.mocked(storage.saveMediaToLocal).mock.invocationCallOrder[0],
    ).toBeLessThan(appviewClient.call.mock.invocationCallOrder[0])
  })

  it('does not create a server draft when local media cannot be persisted', async () => {
    const {appviewClient, hook} = setup()
    const error = new Error('Source media is missing')
    jest.mocked(storage.saveMediaToLocal).mockRejectedValue(error)

    await expect(
      act(() => hook.result.current.mutateAsync({composerState})),
    ).rejects.toBe(error)

    expect(appviewClient.call).not.toHaveBeenCalled()
  })
})
