import {describe, expect, test} from '@jest/globals'

import {hashPostUri} from '#/features/quickReact/analytics'

describe('hashPostUri', () => {
  test('deterministic output for same input', () => {
    const a = hashPostUri('at://did:plc:abc/app.bsky.feed.post/1')
    const b = hashPostUri('at://did:plc:abc/app.bsky.feed.post/1')
    expect(a).toBe(b)
  })

  test('output length exactly 16 hex chars', () => {
    const h = hashPostUri('at://x')
    expect(h).toHaveLength(16)
    expect(h).toMatch(/^[0-9a-f]{16}$/)
  })

  test('distinct inputs produce distinct outputs', () => {
    const a = hashPostUri('at://a')
    const b = hashPostUri('at://b')
    expect(a).not.toBe(b)
  })

  test('raw URI never appears in output', () => {
    const uri = 'at://did:plc:zzz/app.bsky.feed.post/abc123'
    const h = hashPostUri(uri)
    expect(h.includes(uri)).toBe(false)
    expect(h.includes('did:plc')).toBe(false)
  })

  test('known SHA-256 truncation matches reference', () => {
    // SHA-256('abc') = ba7816bf8f01cfea...; first 16 hex chars:
    expect(hashPostUri('abc')).toBe('ba7816bf8f01cfea')
  })
})
