import {
  getYoutubeVideoId,
  makeRecordUri,
  toNiceDomain,
  toShortUrl,
  toShareUrl,
} from '../../src/lib/strings/url-helpers'
import {pluralize, enforceLen} from '../../src/lib/strings/helpers'
import {ago} from '../../src/lib/strings/time'
import {detectLinkables} from '../../src/lib/strings/rich-text-detection'
import {makeValidHandle, createFullHandle} from '../../src/lib/strings/handles'
import {cleanError} from '../../src/lib/strings/errors'

describe('detectLinkables', () => {
  const inputs = [
    'no linkable',
    '@start middle end',
    'start @middle end',
    'start middle @end',
    '@start @middle @end',
    '@full123.test-of-chars',
    'not@right',
    '@bad!@#$chars',
    '@newline1\n@newline2',
    'parenthetical (@handle)',
    'start https://middle.com end',
    'start https://middle.com/foo/bar end',
    'start https://middle.com/foo/bar?baz=bux end',
    'start https://middle.com/foo/bar?baz=bux#hash end',
    'https://start.com/foo/bar?baz=bux#hash middle end',
    'start middle https://end.com/foo/bar?baz=bux#hash',
    'https://newline1.com\nhttps://newline2.com',
    'start middle.com end',
    'start middle.com/foo/bar end',
    'start middle.com/foo/bar?baz=bux end',
    'start middle.com/foo/bar?baz=bux#hash end',
    'start.com/foo/bar?baz=bux#hash middle end',
    'start middle end.com/foo/bar?baz=bux#hash',
    'newline1.com\nnewline2.com',
    'not.. a..url ..here',
    'e.g.',
    'e.g. real.com fake.notreal',
    'something-cool.jpg',
    'website.com.jpg',
    'e.g./foo',
    'website.com.jpg/foo',
    'Classic article https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
    'Classic article https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/ ',
    'https://foo.com https://bar.com/whatever https://baz.com',
    'punctuation https://foo.com, https://bar.com/whatever; https://baz.com.',
    'parenthetical (https://foo.com)',
    'except for https://foo.com/thing_(cool)',
  ]
  const outputs = [
    ['no linkable'],
    [{link: '@start'}, ' middle end'],
    ['start ', {link: '@middle'}, ' end'],
    ['start middle ', {link: '@end'}],
    [{link: '@start'}, ' ', {link: '@middle'}, ' ', {link: '@end'}],
    [{link: '@full123.test-of-chars'}],
    ['not@right'],
    [{link: '@bad'}, '!@#$chars'],
    [{link: '@newline1'}, '\n', {link: '@newline2'}],
    ['parenthetical (', {link: '@handle'}, ')'],
    ['start ', {link: 'https://middle.com'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar?baz=bux'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar?baz=bux#hash'}, ' end'],
    [{link: 'https://start.com/foo/bar?baz=bux#hash'}, ' middle end'],
    ['start middle ', {link: 'https://end.com/foo/bar?baz=bux#hash'}],
    [{link: 'https://newline1.com'}, '\n', {link: 'https://newline2.com'}],
    ['start ', {link: 'middle.com'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar?baz=bux'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar?baz=bux#hash'}, ' end'],
    [{link: 'start.com/foo/bar?baz=bux#hash'}, ' middle end'],
    ['start middle ', {link: 'end.com/foo/bar?baz=bux#hash'}],
    [{link: 'newline1.com'}, '\n', {link: 'newline2.com'}],
    ['not.. a..url ..here'],
    ['e.g.'],
    ['e.g. ', {link: 'real.com'}, ' fake.notreal'],
    ['something-cool.jpg'],
    ['website.com.jpg'],
    ['e.g./foo'],
    ['website.com.jpg/foo'],
    [
      'Classic article ',
      {
        link: 'https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
      },
    ],
    [
      'Classic article ',
      {
        link: 'https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
      },
      ' ',
    ],
    [
      {link: 'https://foo.com'},
      ' ',
      {link: 'https://bar.com/whatever'},
      ' ',
      {link: 'https://baz.com'},
    ],
    [
      'punctuation ',
      {link: 'https://foo.com'},
      ', ',
      {link: 'https://bar.com/whatever'},
      '; ',
      {link: 'https://baz.com'},
      '.',
    ],
    ['parenthetical (', {link: 'https://foo.com'}, ')'],
    ['except for ', {link: 'https://foo.com/thing_(cool)'}],
  ]
  it('correctly handles a set of text inputs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = detectLinkables(input)
      expect(output).toEqual(outputs[i])
    }
  })
})

describe('pluralize', () => {
  const inputs: [number, string, string?][] = [
    [1, 'follower'],
    [1, 'member'],
    [100, 'post'],
    [1000, 'repost'],
    [10000, 'upvote'],
    [100000, 'other'],
    [2, 'man', 'men'],
  ]
  const outputs = [
    'follower',
    'member',
    'posts',
    'reposts',
    'upvotes',
    'others',
    'men',
  ]

  it('correctly pluralizes a set of words', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = pluralize(...input)
      expect(output).toEqual(outputs[i])
    }
  })
})

describe('makeRecordUri', () => {
  const inputs: [string, string, string][] = [
    ['alice.test', 'app.bsky.feed.post', '3jk7x4irgv52r'],
  ]
  const outputs = ['at://alice.test/app.bsky.feed.post/3jk7x4irgv52r']

  it('correctly builds a record URI', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = makeRecordUri(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('ago', () => {
  const inputs = [
    1671461038,
    '04 Dec 1995 00:12:00 GMT',
    new Date(),
    new Date().setMinutes(new Date().getMinutes() - 10),
    new Date().setHours(new Date().getHours() - 1),
    new Date().setDate(new Date().getDate() - 1),
    new Date().setMonth(new Date().getMonth() - 1),
  ]
  const outputs = [
    new Date(1671461038).toLocaleDateString(),
    new Date('04 Dec 1995 00:12:00 GMT').toLocaleDateString(),
    '0s',
    '10m',
    '1h',
    '1d',
    '1mo',
  ]

  it('correctly calculates how much time passed, in a string', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = ago(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('makeValidHandle', () => {
  const inputs = [
    'test-handle-123',
    'test!"#$%&/()=?_',
    'this-handle-should-be-too-big',
  ]
  const outputs = ['test-handle-123', 'test', 'this-handle-should-b']

  it('correctly parses and corrects handles', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = makeValidHandle(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('createFullHandle', () => {
  const inputs: [string, string][] = [
    ['test-handle-123', 'test'],
    ['.test.handle', 'test.test.'],
    ['test.handle.', '.test.test'],
  ]
  const outputs = [
    'test-handle-123.test',
    '.test.handle.test.test.',
    'test.handle.test.test',
  ]

  it('correctly parses and corrects handles', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = createFullHandle(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('enforceLen', () => {
  const inputs: [string, number][] = [
    ['Hello World!', 5],
    ['Hello World!', 20],
    ['', 5],
  ]
  const outputs = ['Hello', 'Hello World!', '']

  it('correctly enforces defined length on a given string', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = enforceLen(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('cleanError', () => {
  const inputs = [
    'TypeError: Network request failed',
    'Error: Aborted',
    'Error: TypeError "x" is not a function',
    'Error: SyntaxError unexpected token "export"',
    'Some other error',
  ]
  const outputs = [
    'Unable to connect. Please check your internet connection and try again.',
    'Unable to connect. Please check your internet connection and try again.',
    'TypeError "x" is not a function',
    'SyntaxError unexpected token "export"',
    'Some other error',
  ]

  it('removes extra content from error message', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = cleanError(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('toNiceDomain', () => {
  const inputs = [
    'https://example.com/index.html',
    'https://bsky.app',
    'https://bsky.social',
    '#123123123',
  ]
  const outputs = ['example.com', 'bsky.app', 'Bluesky Social', '#123123123']

  it("displays the url's host in a easily readable manner", () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = toNiceDomain(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('toShortUrl', () => {
  const inputs = [
    'https://bsky.app',
    'https://bsky.app/3jk7x4irgv52r',
    'https://bsky.app/3jk7x4irgv52r2313y182h9',
  ]
  const outputs = [
    'bsky.app',
    'bsky.app/3jk7x4irgv52r',
    'bsky.app/3jk7x4irgv52r2313y...',
  ]

  it('shortens the url', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = toShortUrl(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('toShareUrl', () => {
  const inputs = ['https://bsky.app', '/3jk7x4irgv52r', 'item/test/123']
  const outputs = [
    'https://bsky.app',
    'https://bsky.app/3jk7x4irgv52r',
    'https://bsky.app/item/test/123',
  ]

  it('appends https, when not present', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = toShareUrl(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('getYoutubeVideoId', () => {
  it(' should return undefined for invalid youtube links', () => {
    expect(getYoutubeVideoId('')).toBeUndefined()
    expect(getYoutubeVideoId('https://www.google.com')).toBeUndefined()
    expect(getYoutubeVideoId('https://www.youtube.com')).toBeUndefined()
    expect(
      getYoutubeVideoId('https://www.youtube.com/channelName'),
    ).toBeUndefined()
    expect(
      getYoutubeVideoId('https://www.youtube.com/channel/channelName'),
    ).toBeUndefined()
  })

  it('getYoutubeVideoId should return video id for valid youtube links', () => {
    expect(getYoutubeVideoId('https://www.youtube.com/watch?v=videoId')).toBe(
      'videoId',
    )
    expect(
      getYoutubeVideoId(
        'https://www.youtube.com/watch?v=videoId&feature=share',
      ),
    ).toBe('videoId')
    expect(getYoutubeVideoId('https://youtu.be/videoId')).toBe('videoId')
  })
})
