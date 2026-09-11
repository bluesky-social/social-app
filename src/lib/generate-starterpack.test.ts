import {type Client} from '@atproto/lex'

import {createStarterPackList} from '#/lib/generate-starterpack'
import {type com} from '#/lexicons'
import type * as bsky from '#/types/bsky'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  usePdsClient: jest.fn(),
}))

describe('createStarterPackList', () => {
  it('batches list item writes', async () => {
    const create = jest.fn().mockResolvedValue({
      uri: 'at://did:plc:test/app.bsky.graph.list/test',
      cid: 'cid',
    })
    const call = jest.fn().mockResolvedValue({})
    const client = {
      assertDid: 'did:plc:test',
      call,
      create,
    } as unknown as Client
    const profiles = Array.from({length: 401}, (_, i) => ({
      did: `did:plc:${i}`,
    })) as bsky.profile.AnyProfileView[]

    await createStarterPackList({
      name: 'Test Starter Pack',
      profiles,
      client,
    })

    expect(call).toHaveBeenCalledTimes(3)
    const inputs = (call.mock.calls as unknown[][]).map(
      ([, input]) => input as com.atproto.repo.applyWrites.$InputBody,
    )
    expect(inputs.map(input => input.writes.length)).toEqual([200, 200, 1])
  })
})
