import {describe, expect, jest, test} from '@jest/globals'

jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {
  EmbeddingDisabledError,
  type LinkResolvers,
  type ResolvedLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {createLinkResolver} from '#/components/ComposerV2/store/linkResolver'

const resolvers = {} as LinkResolvers
const link = {
  type: 'external',
  uri: 'https://example.com',
  title: 'Example',
  description: '',
  thumb: undefined,
} as unknown as ResolvedLink

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function setup() {
  const attempts: ReturnType<typeof deferred<ResolvedLink>>[] = []
  const mockResolve = jest.fn<typeof resolveLink>(() => {
    const attempt = deferred<ResolvedLink>()
    attempts.push(attempt)
    return attempt.promise
  })
  const resolver = createLinkResolver({resolvers, resolve: mockResolve})
  return {attempts, mockResolve, resolver}
}

describe('createLinkResolver', () => {
  test('resolves a link and passes the clients and URI through', async () => {
    const {attempts, mockResolve, resolver} = setup()
    const result = resolver.resolve({key: 'a', uri: 'https://example.com'})
    attempts[0].resolve(link)
    expect(await result).toEqual({ok: true, link})
    expect(mockResolve).toHaveBeenCalledWith(resolvers, 'https://example.com')
  })

  test('embedding-disabled is a permanent failure', async () => {
    const {attempts, resolver} = setup()
    const result = resolver.resolve({key: 'a', uri: 'x'})
    const cause = new EmbeddingDisabledError()
    attempts[0].reject(cause)
    expect(await result).toEqual({
      ok: false,
      code: 'embedding-disabled',
      retryable: false,
      cause,
    })
  })

  test('any other rejection is a retryable unknown failure', async () => {
    const {attempts, resolver} = setup()
    const result = resolver.resolve({key: 'a', uri: 'x'})
    const cause = new Error('network')
    attempts[0].reject(cause)
    expect(await result).toEqual({
      ok: false,
      code: 'unknown',
      retryable: true,
      cause,
    })
  })

  test('a synchronous throw becomes a failure instead of rejecting', async () => {
    const cause = new Error('sync')
    const resolver = createLinkResolver({
      resolvers,
      resolve: () => {
        throw cause
      },
    })
    expect(await resolver.resolve({key: 'a', uri: 'x'})).toEqual({
      ok: false,
      code: 'unknown',
      retryable: true,
      cause,
    })
  })

  test('a synchronous throw can still be cancelled or superseded after resolve returns', async () => {
    const resolver = createLinkResolver({
      resolvers,
      resolve: () => {
        throw new Error('sync')
      },
    })
    const cancelled = resolver.resolve({key: 'a', uri: 'x'})
    resolver.cancel({key: 'a'})
    expect(await cancelled).toBeUndefined()
    const superseded = resolver.resolve({key: 'b', uri: 'x'})
    const latest = resolver.resolve({key: 'b', uri: 'y'})
    expect(await superseded).toBeUndefined()
    expect(await latest).toMatchObject({ok: false})
  })

  test('a superseded request resolves to undefined even if it settles last', async () => {
    const {attempts, resolver} = setup()
    const first = resolver.resolve({key: 'a', uri: 'one'})
    const second = resolver.resolve({key: 'a', uri: 'two'})
    attempts[1].resolve(link)
    expect(await second).toEqual({ok: true, link})
    attempts[0].reject(new Error('late'))
    expect(await first).toBeUndefined()
  })

  test('a superseded request is dropped when it settles first', async () => {
    const {attempts, resolver} = setup()
    const first = resolver.resolve({key: 'a', uri: 'one'})
    const second = resolver.resolve({key: 'a', uri: 'two'})
    attempts[0].resolve(link)
    expect(await first).toBeUndefined()
    attempts[1].resolve(link)
    expect(await second).toEqual({ok: true, link})
  })

  test('cancel drops the in-flight request, success or failure', async () => {
    const {attempts, resolver} = setup()
    const ok = resolver.resolve({key: 'a', uri: 'one'})
    const failed = resolver.resolve({key: 'b', uri: 'two'})
    resolver.cancel({key: 'a'})
    resolver.cancel({key: 'b'})
    resolver.cancel({key: 'never-requested'})
    attempts[0].resolve(link)
    attempts[1].reject(new Error('late'))
    expect(await ok).toBeUndefined()
    expect(await failed).toBeUndefined()
  })

  test('a request made after cancel is unaffected', async () => {
    const {attempts, resolver} = setup()
    const first = resolver.resolve({key: 'a', uri: 'one'})
    resolver.cancel({key: 'a'})
    const second = resolver.resolve({key: 'a', uri: 'two'})
    attempts[0].resolve(link)
    attempts[1].resolve(link)
    expect(await first).toBeUndefined()
    expect(await second).toEqual({ok: true, link})
  })

  test('destroy drops in-flight work and ignores later requests; it is idempotent', async () => {
    const {attempts, mockResolve, resolver} = setup()
    const inFlight = resolver.resolve({key: 'a', uri: 'one'})
    resolver.destroy()
    resolver.destroy()
    attempts[0].resolve(link)
    expect(await inFlight).toBeUndefined()
    expect(await resolver.resolve({key: 'a', uri: 'two'})).toBeUndefined()
    expect(mockResolve).toHaveBeenCalledTimes(1)
  })

  test('keys are independent', async () => {
    const {attempts, resolver} = setup()
    const a = resolver.resolve({key: 'record:p1', uri: 'one'})
    const b = resolver.resolve({key: 'media:p1', uri: 'two'})
    const c = resolver.resolve({key: 'record:p2', uri: 'three'})
    resolver.cancel({key: 'record:p2'})
    attempts[2].resolve(link)
    attempts[1].resolve(link)
    attempts[0].resolve(link)
    expect(await a).toEqual({ok: true, link})
    expect(await b).toEqual({ok: true, link})
    expect(await c).toBeUndefined()
  })
})
