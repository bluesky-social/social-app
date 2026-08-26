import {getMain, XrpcResponseError} from '@atproto/lex'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {com} from '#/lexicons'

const mockCall = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.mock('#/state/session/clients', () => ({
  getPublicAppviewClient: () => ({call: mockCall}),
}))

import {resolvePdsForIdentifier} from '../pds-detection'

function responseError(status: number) {
  return new XrpcResponseError(
    getMain(com.atproto.identity.resolveHandle),
    new Response(null, {status}),
    undefined,
  )
}

describe('resolvePdsForIdentifier', () => {
  beforeEach(() => {
    mockCall.mockReset()
  })

  it.each([429, 500, 502, 503])(
    'surfaces a transient resolveHandle %s response as a network failure',
    async status => {
      mockCall.mockRejectedValueOnce(responseError(status))

      await expect(resolvePdsForIdentifier('samuel.fm')).rejects.toThrow(
        `Network request failed: resolveHandle returned ${status}`,
      )
    },
  )

  it('treats a permanent resolveHandle 4xx response as unresolved', async () => {
    mockCall.mockRejectedValueOnce(responseError(400))

    await expect(resolvePdsForIdentifier('missing.test')).resolves.toBeNull()
  })
})
