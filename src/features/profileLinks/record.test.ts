// the global mock stubs out CID parsing, which the icon fixture needs
jest.unmock('multiformats/cid')

import {parseCid} from '@atproto/lex'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {describe, expect, it, jest} from '@jest/globals'

import {type app} from '#/lexicons'
import {
  filterModeratedLinkViews,
  linksFromProfileView,
  linksFromRecords,
  sameProfileLinks,
  truncateTitle,
} from './record'

const icon = {
  $type: 'blob' as const,
  ref: parseCid('bafkreibq3lmclwphfiidatqr3jkvwrrxpcj3k27kb2zyx4gd4wngevqmta'),
  mimeType: 'image/png',
  size: 1024,
}

const DID = 'did:plc:kat'
const uri = (rkey: string) => `at://${DID}/app.bsky.actor.link/${rkey}`

function view(
  rkey: string,
  url: string,
  extra: Partial<app.bsky.actor.defs.ProfileLinkView> = {},
) {
  return {
    uri: uri(rkey),
    cid: `cid-${rkey}`,
    url,
    ...extra,
  } as app.bsky.actor.defs.ProfileLinkView
}

describe('linksFromProfileView', () => {
  it('reads links in order, with titles and icon URLs', () => {
    expect(
      linksFromProfileView([
        view('a', 'https://ko-fi.com/kat', {title: 'Tip jar'}),
        view('b', 'https://example.com', {
          icon: 'https://cdn.example/icon.png',
        }),
      ]),
    ).toEqual([
      {
        url: 'https://ko-fi.com/kat',
        title: 'Tip jar',
        uri: uri('a'),
        cid: 'cid-a',
      },
      {
        url: 'https://example.com',
        iconUrl: 'https://cdn.example/icon.png',
        uri: uri('b'),
        cid: 'cid-b',
      },
    ])
  })

  it('returns nothing for profiles without links', () => {
    expect(linksFromProfileView(undefined)).toEqual([])
  })

  it('skips links the app does not allow', () => {
    const links = linksFromProfileView([
      view('a', 'javascript:alert(1)'),
      view('b', 'https://onlyfans.com/kat'),
      view('c', 'https://bit.ly/kat'),
      view('d', 'http://insecure.example'),
      view('e', 'https://example.com'),
      view('f', 'https://example.com/'),
    ])
    expect(links.map(link => link.url)).toEqual(['https://example.com'])
  })

  it('caps the number of links', () => {
    const views = Array.from({length: 15}, (_, i) =>
      view(String(i), `https://example.com/${i}`),
    )
    expect(linksFromProfileView(views)).toHaveLength(10)
  })

  it('truncates long titles and drops blank ones', () => {
    const [long, blank] = linksFromProfileView([
      view('a', 'https://a.example', {title: 'x'.repeat(40)}),
      view('b', 'https://b.example', {title: '   '}),
    ])
    expect(long.title).toBe('x'.repeat(30))
    expect(blank.title).toBeUndefined()
  })
})

describe('filterModeratedLinkViews', () => {
  const labeler = 'did:plc:labeler'
  const opts = (adultContentEnabled = false): ModerationOpts => ({
    userDid: 'did:plc:viewer',
    prefs: {
      adultContentEnabled,
      labels: {porn: 'hide'},
      labelers: [{did: labeler, labels: {}}],
      mutedWords: [],
      hiddenPosts: [],
    },
    labelDefs: {},
  })
  const label = (src: string, val: string) => ({
    src,
    uri: uri('a'),
    val,
    cts: '2026-10-15T00:00:00.000Z',
  })
  const labeled = (src: string, val: string) =>
    view('a', 'https://a.example', {
      labels: [label(src, val)] as never,
    })

  it('keeps links without labels', () => {
    const plain = view('b', 'https://b.example')
    expect(filterModeratedLinkViews([plain], opts())).toEqual([plain])
  })

  it('hides links a labeler marks as adult content', () => {
    expect(
      filterModeratedLinkViews([labeled(labeler, 'porn')], opts()),
    ).toEqual([])
  })

  it('hides links the owner self-labels as adult content', () => {
    expect(filterModeratedLinkViews([labeled(DID, 'porn')], opts())).toEqual([])
  })

  it('hides links taken down with !hide', () => {
    expect(
      filterModeratedLinkViews([labeled(labeler, '!hide')], opts()),
    ).toEqual([])
  })

  it('returns nothing for profiles without links', () => {
    expect(filterModeratedLinkViews(undefined, opts())).toBeUndefined()
  })
})

describe('linksFromRecords', () => {
  const record = (
    rkey: string,
    url: string,
    extra: Partial<app.bsky.actor.link.Main> = {},
  ) => ({
    uri: uri(rkey),
    cid: `cid-${rkey}`,
    value: {
      $type: 'app.bsky.actor.link',
      url,
      createdAt: '2026-10-12T00:00:00.000Z',
      ...extra,
    } as app.bsky.actor.link.Main,
  })
  const ref = (rkey: string) => ({uri: uri(rkey), cid: `cid-${rkey}`})

  it('follows the order of the profile refs, keeping icons', () => {
    expect(
      linksFromRecords(
        [ref('b'), ref('a')],
        [
          record('a', 'https://a.example'),
          record('b', 'https://b.example', {title: 'B', icon}),
        ],
      ),
    ).toEqual([
      {url: 'https://b.example', title: 'B', icon, uri: uri('b'), cid: 'cid-b'},
      {url: 'https://a.example', uri: uri('a'), cid: 'cid-a'},
    ])
  })

  it('skips refs whose record is missing', () => {
    expect(
      linksFromRecords(
        [ref('gone'), ref('a')],
        [record('a', 'https://a.example')],
      ).map(link => link.uri),
    ).toEqual([uri('a')])
  })

  it('returns nothing without refs', () => {
    expect(
      linksFromRecords(undefined, [record('a', 'https://a.example')]),
    ).toEqual([])
  })
})

describe('sameProfileLinks', () => {
  const link = {url: 'https://a.example', uri: uri('a'), cid: 'cid-a', icon}

  it('ignores the record CID', () => {
    const {cid: _cid, ...edited} = link
    expect(sameProfileLinks([edited], [link])).toBe(true)
  })

  it('notices edits, reorders and removals', () => {
    const other = {url: 'https://b.example', uri: uri('b')}
    expect(sameProfileLinks([{...link, title: 'A'}], [link])).toBe(false)
    expect(sameProfileLinks([{...link, icon: undefined}], [link])).toBe(false)
    expect(sameProfileLinks([other, link], [link, other])).toBe(false)
    expect(sameProfileLinks([link], [link, other])).toBe(false)
  })
})

describe('truncateTitle', () => {
  it('cuts long titles to the limit', () => {
    expect(truncateTitle('x'.repeat(40))).toBe('x'.repeat(30))
  })

  it('never splits an emoji', () => {
    const title = 'x'.repeat(29) + '🛍️🛍️'
    expect(truncateTitle(title)).toBe('x'.repeat(29) + '🛍️')
  })
})
