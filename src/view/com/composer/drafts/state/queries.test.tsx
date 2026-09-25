import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewClient, useChatClient} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {app} from '#/lexicons'
import {composerStateToDraft} from './api'
import {logger} from './logger'
import {useSaveDraftMutation} from './queries'

jest.unmock('multiformats/cid')
jest.mock('#/lib/async/timeout', () => ({
  timeout: () => Promise.resolve(),
}))
jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useChatClient: jest.fn(),
}))
jest.mock('#/analytics', () => ({useAnalytics: jest.fn()}))
jest.mock('#/analytics/identifiers', () => ({getDeviceId: () => 'device'}))
jest.mock('./api', () => ({composerStateToDraft: jest.fn()}))
jest.mock('./storage', () => ({}))
jest.mock('./logger', () => ({
  logger: {debug: jest.fn(), error: jest.fn(), warn: jest.fn()},
}))

const draft: app.bsky.draft.defs.Draft = {
  $type: 'app.bsky.draft.defs#draft',
  posts: [
    {$type: 'app.bsky.draft.defs#draftPost', text: 'hello', labels: undefined},
  ],
  postgateEmbeddingRules: undefined,
}
const savedView = {
  id: 'saved-draft',
  draft: JSON.parse(JSON.stringify(draft)),
}
const composerState = {} as ComposerState

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: Infinity},
      mutations: {gcTime: Infinity},
    },
  })
  const read = jest.fn().mockResolvedValue({drafts: [savedView]})
  const write = jest.fn().mockResolvedValue({id: savedView.id})
  const call = jest.fn((method: unknown) =>
    method === app.bsky.draft.getDrafts ? read() : write(),
  )
  jest.mocked(useAppviewClient).mockReturnValue({call} as never)
  jest.mocked(useChatClient).mockReturnValue({} as never)
  jest.mocked(composerStateToDraft).mockResolvedValue({
    draft,
    localRefPaths: new Map(),
  })
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
  function wrapper({children}: {children: React.ReactNode}) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  const hook = renderHook(() => useSaveDraftMutation(), {wrapper})
  return {hook, read, write, call, invalidate, queryClient}
}

beforeEach(() => jest.clearAllMocks())

it('waits for a newly created draft before invalidating the list', async () => {
  const {hook, read, write, invalidate} = setup()
  let finishRead!: (value: {drafts: (typeof savedView)[]}) => void
  read.mockResolvedValueOnce({drafts: []}).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishRead = resolve
      }),
  )
  let save!: ReturnType<typeof hook.result.current.mutateAsync>
  act(() => {
    save = hook.result.current.mutateAsync({composerState})
  })
  await waitFor(() => expect(read).toHaveBeenCalledTimes(2))
  expect(hook.result.current.isPending).toBe(true)
  expect(invalidate).not.toHaveBeenCalled()

  await act(async () => {
    finishRead({drafts: [savedView]})
    await expect(save).resolves.toMatchObject({draftId: savedView.id})
  })
  expect(write).toHaveBeenCalledTimes(1)
  expect(invalidate).toHaveBeenCalledWith({queryKey: ['drafts']})
})

it('waits for the updated contents rather than accepting an existing draft ID', async () => {
  const {hook, read, call} = setup()
  read.mockResolvedValueOnce({
    drafts: [{...savedView, draft: {...draft, posts: [{text: 'old text'}]}}],
  })
  await act(() =>
    hook.result.current.mutateAsync({
      composerState,
      existingDraftId: savedView.id,
    }),
  )
  expect(call).toHaveBeenCalledWith(app.bsky.draft.updateDraft, {
    draft: {id: savedView.id, draft},
  })
  expect(read).toHaveBeenCalledTimes(2)
  expect(logger.warn).not.toHaveBeenCalled()
})

it('retries a transient read failure without repeating the write', async () => {
  const {hook, read, write} = setup()
  read.mockRejectedValueOnce(new Error('Temporary read failure'))
  await act(() => hook.result.current.mutateAsync({composerState}))
  expect(read).toHaveBeenCalledTimes(2)
  expect(write).toHaveBeenCalledTimes(1)
  expect(logger.warn).not.toHaveBeenCalled()
})

it.each(['missing', 'error'])(
  'bounds polling when reads keep returning %s',
  async failure => {
    const {hook, read, write, invalidate} = setup()
    if (failure === 'missing') {
      read.mockResolvedValue({drafts: []})
    } else {
      read.mockRejectedValue(new Error('Draft list unavailable'))
    }
    await act(async () => {
      await expect(
        hook.result.current.mutateAsync({composerState}),
      ).resolves.toMatchObject({draftId: savedView.id})
    })
    expect(read).toHaveBeenCalledTimes(5)
    expect(write).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'Saved draft not yet visible in drafts list',
      {draftId: savedView.id},
    )
    expect(invalidate).toHaveBeenCalledWith({queryKey: ['drafts']})
  },
)

it('does not poll when the write fails', async () => {
  const {hook, read, write, invalidate} = setup()
  write.mockRejectedValue(new Error('Save failed'))
  await act(async () => {
    await expect(
      hook.result.current.mutateAsync({composerState}),
    ).rejects.toThrow('Save failed')
  })
  expect(read).not.toHaveBeenCalled()
  expect(invalidate).not.toHaveBeenCalled()
})
