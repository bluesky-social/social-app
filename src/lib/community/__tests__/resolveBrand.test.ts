import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {
  fetchBrandBySlug,
  normalizeHost,
  resolveBrandForAccount,
  resolveBrandForPds,
} from '../resolveBrand'

describe('normalizeHost', () => {
  it('strips scheme, port, path, and lowercases', () => {
    expect(normalizeHost('https://Blacksky.app')).toBe('blacksky.app')
    expect(normalizeHost('blacksky.app')).toBe('blacksky.app')
    expect(normalizeHost('https://blacksky.app:443/xrpc')).toBe('blacksky.app')
    expect(normalizeHost('http://pds.example.com/')).toBe('pds.example.com')
    expect(normalizeHost('  https://blacksky.app/  ')).toBe('blacksky.app')
    expect(normalizeHost('blacksky.app.')).toBe('blacksky.app')
  })
})

describe('brand resolution', () => {
  const makeResponse = (body: unknown, ok = true): Response =>
    ({ok, json: () => Promise.resolve(body)}) as unknown as Response
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = jest
      .fn<typeof fetch>()
      .mockResolvedValue(
        makeResponse({slug: 'x', status: 'published', computed: {slug: 'x'}}),
      )
    global.fetch = fetchMock
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  function calledUrl(): string {
    const arg = fetchMock.mock.calls[0]?.[0]
    return typeof arg === 'string' ? arg : ''
  }

  it('fetchBrandBySlug hits ?slug=', async () => {
    await fetchBrandBySlug('latinsky')
    expect(calledUrl()).toContain('/brands/resolve?slug=latinsky')
  })

  it('resolveBrandForPds normalizes the host into ?pds=', async () => {
    await resolveBrandForPds('https://blacksky.app:443/')
    expect(calledUrl()).toContain('/brands/resolve?pds=blacksky.app')
  })

  it('returns null (falls back to default) on non-ok responses', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({}, false))
    expect(await resolveBrandForPds('https://blacksky.app')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    expect(await resolveBrandForPds('https://blacksky.app')).toBeNull()
  })

  describe('resolveBrandForAccount precedence', () => {
    it('1. stamped communitySlug wins over everything', async () => {
      await resolveBrandForAccount({
        communitySlug: 'medsky',
        pdsUrl: 'https://blacksky.app',
        handle: 'a.latinsky.app',
      })
      expect(calledUrl()).toContain('slug=medsky')
    })

    it('2. Latinsky carveout: Blacksky PDS + latinsky handle → latinsky slug', async () => {
      await resolveBrandForAccount({
        pdsUrl: 'https://blacksky.app',
        handle: 'alice.latinsky.app',
      })
      expect(calledUrl()).toContain('slug=latinsky')
    })

    it('2b. afrolatinsky handle also triggers the carveout', async () => {
      await resolveBrandForAccount({
        pdsUrl: 'https://blacksky.app',
        handle: 'bob.afrolatinsky.app',
      })
      expect(calledUrl()).toContain('slug=latinsky')
    })

    it('3. plain Blacksky account → null (bundled default), never PDS-resolved', async () => {
      const result = await resolveBrandForAccount({
        pdsUrl: 'https://blacksky.app',
        handle: 'alice.blacksky.app',
      })
      expect(result).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('3b. a latinsky-looking handle on a different PDS is NOT the carveout', async () => {
      await resolveBrandForAccount({
        pdsUrl: 'https://pds.example.com',
        handle: 'evil.latinsky.app',
      })
      expect(calledUrl()).toContain('pds=pds.example.com')
    })

    it('returns null when there is no pdsUrl and no slug', async () => {
      expect(
        await resolveBrandForAccount({handle: 'a.blacksky.app'}),
      ).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
