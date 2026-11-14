import {describe, expect, it} from '@jest/globals'

import {
  atUriToHref,
  getChatInviteCodeFromUrl,
  isPossiblyAUrl,
  isTrustedUrl,
  linkRequiresWarning,
  splitApexDomain,
} from '../../../src/lib/strings/url-helpers'
import {router} from '../../../src/routes'

describe('linkRequiresWarning', () => {
  type Case = [string, string, boolean]

  const cases: Case[] = [
    ['http://example.com', 'http://example.com', false],
    ['http://example.com', 'example.com', false],
    ['http://example.com', 'example.com/page', false],
    ['http://example.com', '', true],
    ['http://example.com', 'other.com', true],
    ['http://example.com', 'http://other.com', true],
    ['http://example.com', 'some label', true],
    ['http://example.com', 'example.com more', true],
    ['http://example.com', 'http://example.co', true],
    ['http://example.co', 'http://example.com', true],
    ['http://example.com', 'example.co', true],
    ['http://example.co', 'example.com', true],
    ['http://site.pages.dev', 'http://site.page', true],
    ['http://site.page', 'http://site.pages.dev', true],
    ['http://site.pages.dev', 'site.page', true],
    ['http://site.page', 'site.pages.dev', true],
    ['http://site.pages.dev', 'http://site.pages', true],
    ['http://site.pages', 'http://site.pages.dev', true],
    ['http://site.pages.dev', 'site.pages', true],
    ['http://site.pages', 'site.pages.dev', true],
    ['http://bsky.app/profile/bob.test/post/3kbeuduu7m22v', 'my post', false],
    ['https://bsky.app/profile/bob.test/post/3kbeuduu7m22v', 'my post', false],
    ['http://bsky.app/', 'bluesky', false],
    ['https://bsky.app/', 'bluesky', false],
    [
      'http://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      'http://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      false,
    ],
    [
      'https://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      'http://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      false,
    ],
    [
      'http://bsky.app/',
      'http://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      false,
    ],
    [
      'https://bsky.app/',
      'http://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      false,
    ],
    [
      'http://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      'https://google.com',
      true,
    ],
    [
      'https://bsky.app/profile/bob.test/post/3kbeuduu7m22v',
      'https://google.com',
      true,
    ],
    ['http://bsky.app/', 'https://google.com', true],
    ['https://bsky.app/', 'https://google.com', true],

    // case insensitive
    ['https://Example.com', 'example.com', false],
    ['https://example.com', 'Example.com', false],

    // bad uri inputs, default to true
    ['', '', true],
    ['example.com', 'example.com', true],
    ['/profile', 'Username', false],
    ['#', 'Show More', false],
    ['https://docs.bsky.app', 'https://docs.bsky.app', false],
    ['https://bsky.app/compose/intent?text=test', 'Compose a post', false],
  ]

  it.each(cases)(
    'given input uri %p and text %p, returns %p',
    (uri, text, expected) => {
      const output = linkRequiresWarning(uri, text)
      expect(output).toEqual(expected)
    },
  )
})

describe('isPossiblyAUrl', () => {
  type Case = [string, boolean]
  const cases: Case[] = [
    ['', false],
    ['text', false],
    ['some text', false],
    ['some text', false],
    ['some domain.com', false],
    ['domain.com', true],
    [' domain.com', true],
    ['domain.com ', true],
    [' domain.com ', true],
    ['http://domain.com', true],
    [' http://domain.com', true],
    ['http://domain.com ', true],
    [' http://domain.com ', true],
    ['https://domain.com', true],
    [' https://domain.com', true],
    ['https://domain.com ', true],
    [' https://domain.com ', true],
    ['http://domain.com/foo', true],
    ['http://domain.com stuff', true],
  ]

  it.each(cases)('given input uri %p, returns %p', (str, expected) => {
    const output = isPossiblyAUrl(str)
    expect(output).toEqual(expected)
  })
})

describe('splitApexDomain', () => {
  type Case = [string, string, string]
  const cases: Case[] = [
    ['', '', ''],
    ['example.com', '', 'example.com'],
    ['foo.example.com', 'foo.', 'example.com'],
    ['foo.bar.example.com', 'foo.bar.', 'example.com'],
    ['example.co.uk', '', 'example.co.uk'],
    ['foo.example.co.uk', 'foo.', 'example.co.uk'],
    ['example.nonsense', '', 'example.nonsense'],
    ['foo.example.nonsense', '', 'foo.example.nonsense'],
    ['foo.bar.example.nonsense', '', 'foo.bar.example.nonsense'],
    ['example.com.example.com', 'example.com.', 'example.com'],
  ]

  it.each(cases)(
    'given input uri %p, returns %p,%p',
    (str, expected1, expected2) => {
      const output = splitApexDomain(str)
      expect(output[0]).toEqual(expected1)
      expect(output[1]).toEqual(expected2)
    },
  )
})

describe('isTrustedUrl', () => {
  const cases = [
    ['#', true],
    ['#profile', true],
    ['/', true],
    ['/profile', true],
    ['/profile/', true],
    ['/profile/bob.test', true],
    ['https://bsky.app', true],
    ['https://bsky.app/', true],
    ['https://bsky.app/profile/bob.test', true],
    ['https://www.bsky.app', true],
    ['https://www.bsky.app/', true],
    ['https://docs.bsky.app', true],
    ['https://bsky.social', true],
    ['https://bsky.social/blog', true],
    ['https://blueskyweb.xyz', true],
    ['https://blueskyweb.zendesk.com', true],
    ['http://bsky.app', true],
    ['http://bsky.social', true],
    ['http://blueskyweb.xyz', true],
    ['http://blueskyweb.zendesk.com', true],
    ['https://google.com', false],
    ['https://docs.google.com', false],
    ['https://google.com/#', false],
    ['https://blueskywebxzendesk.com', false],
  ]

  it.each(cases)('given input uri %p, returns %p', (str, expected) => {
    const output = isTrustedUrl(str)
    expect(output).toEqual(expected)
  })
})

describe('getChatInviteCodeFromUrl', () => {
  type Case = [string, string | undefined]

  const cases: Case[] = [
    ['https://bsky.app/chat/abcdefg', 'abcdefg'],
    ['https://bsky.app/chat/abcdefghij', 'abcdefghij'],
    // http is not recognized as a bsky.app url
    ['http://bsky.app/chat/abcdefg', undefined],
    ['https://bsky.app/chat/abcdefg?utm=foo', 'abcdefg'],
    ['https://bsky.app/chat/abcdefg#section', 'abcdefg'],
    ['/chat/abcdefg', 'abcdefg'],
    ['/chat/abcdefg?utm=foo', 'abcdefg'],
    ['/chat/abcdefg#section', 'abcdefg'],

    // too short
    ['https://bsky.app/chat/abcdef', undefined],
    ['/chat/abcdef', undefined],
    // too long
    ['https://bsky.app/chat/abcdefghijk', undefined],
    ['/chat/abcdefghijk', undefined],
    // invalid characters
    ['https://bsky.app/chat/abc-def', undefined],
    ['/chat/abc def', undefined],
    // trailing path
    ['https://bsky.app/chat/abcdefg/extra', undefined],
    ['/chat/abcdefg/extra', undefined],
    // wrong path
    ['https://bsky.app/profile/abcdefg', undefined],
    ['https://bsky.app/chat', undefined],
    // wrong host
    ['https://example.com/chat/abcdefg', undefined],
    // not a url, not a path
    ['chat/abcdefg', undefined],
    ['abcdefg', undefined],
    ['', undefined],
    // malformed url
    ['https://[invalid/chat/abcdefg', undefined],
  ]

  it.each(cases)('given input %p, returns %p', (input, expected) => {
    expect(getChatInviteCodeFromUrl(input)).toEqual(expected)
  })
})

describe('atUriToHref', () => {
  type Case = [string, string | undefined]
  const did = 'did:plc:z72i7hdynmk6r22z27h6tvur'
  const cases: Case[] = [
    // profiles
    [`at://${did}`, `/profile/${did}`],
    [`at://${did}/`, `/profile/${did}`],
    ['at://bsky.app', '/profile/bsky.app'],
    [`at://${did}/app.bsky.actor.profile/self`, `/profile/${did}`],
    [`at://${did}/app.bsky.labeler.service/self`, `/profile/${did}`],

    // records
    [
      `at://${did}/app.bsky.feed.post/3l3qo2vuowo2b`,
      `/profile/${did}/post/3l3qo2vuowo2b`,
    ],
    [
      'at://bsky.app/app.bsky.feed.post/3l3qo2vuowo2b',
      '/profile/bsky.app/post/3l3qo2vuowo2b',
    ],
    [
      `at://${did}/app.bsky.feed.generator/whats-hot`,
      `/profile/${did}/feed/whats-hot`,
    ],
    [
      `at://${did}/app.bsky.graph.list/3k3iwgggbkn2b`,
      `/profile/${did}/lists/3k3iwgggbkn2b`,
    ],
    [
      `at://${did}/app.bsky.graph.starterpack/3l5idg3onph2d`,
      `/starter-pack/${did}/3l5idg3onph2d`,
    ],

    // record collections need a record key
    [`at://${did}/app.bsky.feed.post`, undefined],
    [`at://${did}/app.bsky.feed.post/`, undefined],
    // collections without a screen
    [`at://${did}/app.bsky.feed.like/3l3qo2vuowo2b`, undefined],
    [`at://${did}/com.example.record/3l3qo2vuowo2b`, undefined],
    // invalid AT-URIs
    ['at://', undefined],
    ['at://not-a-handle/app.bsky.feed.post/3l3qo2vuowo2b', undefined],
    [`at://${did}/not-an-nsid/3l3qo2vuowo2b`, undefined],
    [`at://${did}/app.bsky.feed.post/3l3qo2vuowo2b/extra`, undefined],
    [`at://${did}/app.bsky.feed.post/3l3qo2vuowo2b from:me`, undefined],
    // not AT-URIs
    [`https://bsky.app/profile/${did}/post/3l3qo2vuowo2b`, undefined],
    [`/profile/${did}`, undefined],
    [did, undefined],
    ['bluesky', undefined],
    ['', undefined],
  ]

  it.each(cases)('given input %p, returns %p', (input, expected) => {
    expect(atUriToHref(input)).toEqual(expected)
  })

  it.each([
    [`at://${did}`, 'Profile', {name: did}],
    [
      `at://${did}/app.bsky.feed.post/3l3qo2vuowo2b`,
      'PostThread',
      {name: did, rkey: '3l3qo2vuowo2b'},
    ],
    [
      `at://${did}/app.bsky.feed.generator/whats-hot`,
      'CustomFeed',
      {name: did, rkey: 'whats-hot'},
    ],
    [
      `at://${did}/app.bsky.graph.list/3k3iwgggbkn2b`,
      'ProfileList',
      {name: did, rkey: '3k3iwgggbkn2b'},
    ],
    [
      `at://${did}/app.bsky.graph.starterpack/3l5idg3onph2d`,
      'StarterPack',
      {name: did, rkey: '3l5idg3onph2d'},
    ],
  ])('routes %p to the %p screen', (input, screen, params) => {
    expect(router.matchPath(atUriToHref(input)!)).toEqual([screen, params])
  })
})
