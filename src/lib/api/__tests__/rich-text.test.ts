import {type Client} from '@atproto/lex'
import {type RichText} from '@bsky/sdk/richtext'
import {describe, expect, jest, test} from '@jest/globals'

import {resolveRichText} from '#/lib/api/rich-text'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * detectFacets resolves mentions through com.atproto.identity.resolveHandle;
 * unknown handles resolve to null so their facets are stripped.
 */
function mockAppview(dids: Record<string, string> = {}) {
  return {
    call: jest.fn((_ns: unknown, args: unknown) => {
      const handle = (args as {handle: string}).handle
      const did = dids[handle]
      if (!did) return Promise.reject(new Error('handle not found'))
      return Promise.resolve({did})
    }),
  } as unknown as Client
}

function mentions(rt: RichText) {
  return (rt.facets ?? []).flatMap(facet =>
    facet.features.filter(feature =>
      bsky.isType(app.bsky.richtext.facet.mention, feature),
    ),
  )
}

function links(rt: RichText) {
  return (rt.facets ?? []).flatMap(facet =>
    facet.features.filter(feature =>
      bsky.isType(app.bsky.richtext.facet.link, feature),
    ),
  )
}

describe('resolveRichText', () => {
  test('trims leading whitespace-only lines without breaking ASCII art', async () => {
    const rt = await resolveRichText({
      appviewClient: mockAppview(),
      text: '\n   \n\nhello',
    })
    expect(rt.text).toBe('hello')

    /* Indentation on a line with content is ASCII art, not blank padding. */
    const art = await resolveRichText({
      appviewClient: mockAppview(),
      text: '  /\\_/\\\n ( o.o )',
    })
    expect(art.text).toBe('  /\\_/\\\n ( o.o )')
  })

  test('trims trailing whitespace and newlines', async () => {
    const rt = await resolveRichText({
      appviewClient: mockAppview(),
      text: 'hello  \n\n   ',
    })
    expect(rt.text).toBe('hello')
  })

  test('cleans excessive consecutive newlines', async () => {
    const rt = await resolveRichText({
      appviewClient: mockAppview(),
      text: 'one\n\n\n\n\ntwo',
    })
    expect(rt.text).toBe('one\n\ntwo')
  })

  test('shortens link display text while preserving the full URL facet', async () => {
    const url = 'https://example.com/some/very/long/path/that/keeps/going'
    const rt = await resolveRichText({
      appviewClient: mockAppview(),
      text: `check ${url}`,
    })
    expect(rt.text).toBe('check example.com/some/very/lo...')
    expect(links(rt)).toEqual([
      expect.objectContaining({
        $type: 'app.bsky.richtext.facet#link',
        uri: url,
      }),
    ])
  })

  test('keeps resolved mentions and strips unresolvable ones', async () => {
    const client = mockAppview({'alice.test': 'did:plc:alice'})
    const resolved = await resolveRichText({
      appviewClient: client,
      text: 'hi @alice.test',
    })
    expect(resolved.text).toBe('hi @alice.test')
    expect(mentions(resolved)).toEqual([
      expect.objectContaining({did: 'did:plc:alice'}),
    ])

    const stripped = await resolveRichText({
      appviewClient: client,
      text: 'hi @missing.test',
    })
    expect(stripped.text).toBe('hi @missing.test')
    expect(mentions(stripped)).toEqual([])
  })

  test('measures the 300-grapheme boundary the validators enforce', async () => {
    const atLimit = await resolveRichText({
      appviewClient: mockAppview(),
      text: '💙'.repeat(300),
    })
    expect(atLimit.graphemeLength).toBe(300)

    const overLimit = await resolveRichText({
      appviewClient: mockAppview(),
      text: '💙'.repeat(301),
    })
    expect(overLimit.graphemeLength).toBe(301)
  })
})
