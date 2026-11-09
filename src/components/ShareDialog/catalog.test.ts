import {describe, expect, it} from '@jest/globals'

import {getNativeQueries, SHARE_PLATFORMS} from './catalog'

const content = {
  url: 'https://bsky.app/profile/alice.test/post/3abc?x=1&y=2',
  title: 'Post by @alice.test on Bluesky',
}

describe('SHARE_PLATFORMS', () => {
  it('has unique ids', () => {
    const ids = SHARE_PLATFORMS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('supports at least one OS for every platform', () => {
    for (const p of SHARE_PLATFORMS) {
      expect(p.ios ?? p.android).toBeDefined()
    }
  })

  it('encodes the post link in every share URL', () => {
    for (const p of SHARE_PLATFORMS) {
      const urls = [
        p.ios?.getShareUrl?.(content),
        p.android?.getShareUrl?.(content),
      ].filter(u => u !== undefined)
      for (const url of urls) {
        expect(url).toContain(encodeURIComponent(content.url))
        // the raw link's own query would leak into the share URL's params
        expect(url).not.toContain('?x=1&y=2')
      }
    }
  })

  it('gives every Android platform a way to be detected', () => {
    for (const p of SHARE_PLATFORMS) {
      if (!p.android) continue
      expect(p.android.packages?.length || p.android.scheme).toBeTruthy()
    }
  })
})

describe('getNativeQueries', () => {
  const queries = getNativeQueries()

  it('stays under the iOS limit of 50 query schemes', () => {
    expect(queries.iosSchemes.length).toBeLessThanOrEqual(50)
  })

  it('declares every scheme and package the catalog checks', () => {
    for (const p of SHARE_PLATFORMS) {
      if (p.ios) expect(queries.iosSchemes).toContain(p.ios.scheme)
      for (const pkg of p.android?.packages ?? []) {
        expect(queries.androidPackages).toContain(pkg)
      }
      if (p.android?.scheme) {
        expect(queries.androidSchemes).toContain(p.android.scheme)
      }
    }
  })

  it('has no duplicates', () => {
    for (const list of Object.values(queries)) {
      expect(new Set(list).size).toBe(list.length)
    }
  })
})
