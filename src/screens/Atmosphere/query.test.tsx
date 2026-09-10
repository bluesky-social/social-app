import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewSandboxClient, useSession} from '#/state/session'
import {useAtmosphereQuery} from './query'

jest.mock('#/state/session', () => ({
  useAppviewSandboxClient: jest.fn(),
  useSession: jest.fn(),
}))

const viewer = 'did:plc:viewer'

function setup(responses: unknown[]) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  const client = {call: jest.fn()}
  for (const response of responses) {
    client.call.mockResolvedValueOnce(response)
  }
  jest.mocked(useAppviewSandboxClient).mockReturnValue(client as never)
  jest.mocked(useSession).mockReturnValue({
    hasSession: true,
    currentAccount: {did: viewer},
  } as never)
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useAtmosphereQuery(), {wrapper})
  return {client, hook}
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAtmosphereQuery', () => {
  it('uses session auth and passes the pagination cursor through unchanged', async () => {
    const firstPage = {
      feed: [],
      associatedRecords: {},
      actors: {},
      cursor: 'opaque-cursor',
    }
    const secondPage = {
      feed: [],
      associatedRecords: {},
      actors: {},
    }
    const {client, hook} = setup([firstPage, secondPage])

    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(client.call).toHaveBeenNthCalledWith(1, expect.anything(), {
      cursor: undefined,
    })
    expect(hook.result.current.hasNextPage).toBe(true)

    await act(() => hook.result.current.fetchNextPage())

    expect(client.call).toHaveBeenNthCalledWith(2, expect.anything(), {
      cursor: 'opaque-cursor',
    })
    await waitFor(() => expect(hook.result.current.hasNextPage).toBe(false))
  })
})
