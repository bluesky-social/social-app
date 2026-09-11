import {type Client} from '@atproto/lex'

import {type app} from '#/lexicons'
import {getAllListMembers} from '../list-members'

jest.mock('#/state/queries', () => ({
  STALE: {MINUTES: {ONE: 60_000}},
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))

describe('getAllListMembers', () => {
  it('fetches every page', async () => {
    const call = jest.fn()
    for (let i = 0; i < 7; i++) {
      call.mockResolvedValueOnce({
        items: [{uri: `at://did:plc:test/app.bsky.graph.listitem/${i}`}],
        cursor: i < 6 ? String(i + 1) : undefined,
      })
    }
    const client = {call} as unknown as Client

    const items = await getAllListMembers(
      client,
      'at://did:plc:test/app.bsky.graph.list/test',
    )

    expect(items).toHaveLength(7)
    expect(call).toHaveBeenCalledTimes(7)
    const params = (call.mock.calls as unknown[][]).map(
      ([, params]) => params as app.bsky.graph.getList.$Params,
    )
    expect(params.map(callParams => callParams.limit)).toEqual(
      Array(7).fill(100),
    )
  })

  it('rejects a repeated cursor', async () => {
    const call = jest
      .fn()
      .mockResolvedValueOnce({items: [], cursor: 'repeated'})
      .mockResolvedValueOnce({items: [], cursor: 'repeated'})
    const client = {call} as unknown as Client

    await expect(
      getAllListMembers(client, 'at://did:plc:test/app.bsky.graph.list/test'),
    ).rejects.toThrow('Repeated cursor while fetching list members')
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('stops after 500 members', async () => {
    const call = jest.fn()
    for (let page = 0; page < 6; page++) {
      call.mockResolvedValueOnce({
        items: Array.from({length: 100}, (_, item) => ({
          uri: `at://did:plc:test/app.bsky.graph.listitem/${page}-${item}`,
        })),
        cursor: String(page + 1),
      })
    }
    const client = {call} as unknown as Client

    const items = await getAllListMembers(
      client,
      'at://did:plc:test/app.bsky.graph.list/test',
    )

    expect(items).toHaveLength(500)
    expect(call).toHaveBeenCalledTimes(5)
  })
})
