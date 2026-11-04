import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewClient, useSession} from '#/state/session'
import {useModerationInboxSubjectQuery} from '../moderation-inbox'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useSession: jest.fn(),
}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))

const subject = 'did:plc:owner' as const
const moderationService = 'did:plc:moderator' as const
const call = jest.fn()

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  return ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useAppviewClient).mockReturnValue({call} as never)
  jest.mocked(useSession).mockReturnValue({
    currentAccount: {did: 'did:plc:viewer'},
    hasSession: true,
  } as never)
})

it('shares an in-flight request and fresh history for the same account and service', async () => {
  let resolveRequest!: (value: {actions: never[]}) => void
  call.mockImplementation(
    () => new Promise(resolve => (resolveRequest = resolve)),
  )
  const wrapper = setup()
  const hook = renderHook(
    () => [
      useModerationInboxSubjectQuery({subject, moderationService}),
      useModerationInboxSubjectQuery({subject, moderationService}),
    ],
    {wrapper},
  )

  await waitFor(() => expect(call).toHaveBeenCalledTimes(1))
  act(() => resolveRequest({actions: []}))
  await waitFor(() => {
    expect(hook.result.current[0].isSuccess).toBe(true)
    expect(hook.result.current[1].isSuccess).toBe(true)
  })
  hook.unmount()

  const remounted = renderHook(
    () => useModerationInboxSubjectQuery({subject, moderationService}),
    {wrapper},
  )
  await waitFor(() => expect(remounted.result.current.isSuccess).toBe(true))
  expect(call).toHaveBeenCalledTimes(1)
  remounted.unmount()
})

it('keeps different subjects, services, history pages and viewers separate', async () => {
  call.mockResolvedValue({actions: []})
  const wrapper = setup()
  const hook = renderHook(
    () => [
      useModerationInboxSubjectQuery({subject, moderationService}),
      useModerationInboxSubjectQuery({
        subject: 'did:plc:other',
        moderationService,
      }),
      useModerationInboxSubjectQuery({
        subject,
        moderationService: 'did:plc:othermoderator',
      }),
      useModerationInboxSubjectQuery({
        subject,
        moderationService,
        initialCursor: 'older',
      }),
    ],
    {wrapper},
  )
  await waitFor(() => expect(call).toHaveBeenCalledTimes(4))
  hook.unmount()

  jest.mocked(useSession).mockReturnValue({
    currentAccount: {did: 'did:plc:otherviewer'},
    hasSession: true,
  } as never)
  const otherViewer = renderHook(
    () => useModerationInboxSubjectQuery({subject, moderationService}),
    {wrapper},
  )
  await waitFor(() => expect(call).toHaveBeenCalledTimes(5))
  otherViewer.unmount()
})
