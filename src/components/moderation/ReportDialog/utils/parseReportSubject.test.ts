import {describe, expect, it, jest} from '@jest/globals'

import {type app, type com} from '#/lexicons'
import {BSKY_LABELER_ONLY_SUBJECT_TYPES} from '../const'
import {type ReportSubject} from '../types'
import {
  getAssociatedReportSubjects,
  parseReportSubject,
} from './parseReportSubject'

/* Associated ref validation needs real CID parsing, which the repo mocks. */
jest.unmock('multiformats/cid')

const CID_A = 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti'
const CID_B = 'bafyreig3yg2msah74sgvow25uxddqbabex3f3mh6hysess3w5kmgiv6zqy'
const REPO = 'at://did:plc:6ayddqghxhciedbaofoxkcbs'
const first = {uri: `${REPO}/app.test.first/3kaaa`, cid: CID_A}
const second = {uri: `${REPO}/app.test.second/3kbbb`, cid: CID_B}

function article(associatedRefs?: {uri: string; cid: string}[]) {
  return {
    $type: 'app.bsky.embed.external#viewArticle',
    uri: 'https://example.com/article',
    title: 'An article',
    description: '',
    associatedRefs,
  } as app.bsky.embed.external.ViewArticle & {
    $type: 'app.bsky.embed.external#viewArticle'
  }
}

function photo(associatedRefs?: {uri: string; cid: string}[]) {
  return {
    $type: 'app.bsky.embed.external#viewGallery',
    uri: 'https://example.com/photo',
    title: 'A photo',
    description: '',
    items: [],
    associatedRefs,
  } as app.bsky.embed.external.ViewGallery & {
    $type: 'app.bsky.embed.external#viewGallery'
  }
}

describe('parseReportSubject', () => {
  it('reports a profile link as its link record', () => {
    const link = {
      $type: 'app.bsky.actor.defs#profileLinkView',
      uri: 'at://did:plc:kat/app.bsky.actor.link/3kabc',
      cid: 'bafyreigjtngycmin6ae2654mhhjcmtusy34pz6m5nsonc7vvubll6pokiu',
      url: 'https://ko-fi.com/kat',
    } as app.bsky.actor.defs.ProfileLinkView & {
      $type: 'app.bsky.actor.defs#profileLinkView'
    }
    expect(parseReportSubject(link)).toEqual({
      type: 'profileLink',
      uri: link.uri,
      cid: link.cid,
      nsid: 'app.bsky.actor.link',
    })
  })

  it('reports the first valid associated record of an article or photo', () => {
    const refs = [
      {uri: 'https://example.com/ref', cid: CID_A},
      {uri: first.uri, cid: 'not-a-cid'},
      first,
      second,
    ]
    const expected = {
      type: 'record',
      uri: first.uri,
      cid: first.cid,
      nsid: 'app.test.first',
    }
    expect(parseReportSubject(article(refs))).toEqual(expected)
    expect(parseReportSubject(photo(refs))).toEqual(expected)
  })

  it('classifies a direct record reference by its own collection', () => {
    expect(parseReportSubject(strongRef(second))).toEqual({
      type: 'record',
      uri: second.uri,
      cid: second.cid,
      nsid: 'app.test.second',
    })
    expect(
      parseReportSubject(strongRef({uri: first.uri, cid: 'nope'})),
    ).toBeUndefined()
  })

  it('accepts associated refs that carry their own $type', () => {
    const ref = {...first, $type: 'com.atproto.repo.strongRef'}
    expect(parseReportSubject(article([ref]))).toMatchObject({uri: first.uri})
  })

  it.each([
    ['missing refs', undefined],
    ['empty refs', []],
    ['an invalid CID', [{uri: first.uri, cid: 'nope'}]],
    ['a malformed URI', [{uri: 'at://', cid: CID_A}]],
    ['an HTTP URI', [{uri: 'https://example.com/a/b/c', cid: CID_A}]],
    ['a repo-only URI', [{uri: REPO, cid: CID_A}]],
    ['a collection-only URI', [{uri: `${REPO}/app.test.first`, cid: CID_A}]],
    ['a URI with a query', [{uri: `${first.uri}?a=1`, cid: CID_A}]],
    ['a URI with a fragment', [{uri: `${first.uri}#a`, cid: CID_A}]],
  ])('is not reportable with %s', (_name, refs) => {
    expect(parseReportSubject(article(refs))).toBeUndefined()
    expect(parseReportSubject(photo(refs))).toBeUndefined()
  })
})

type Ref = {uri: string; cid: string}
const strongRef = (ref: Ref) =>
  ({$type: 'com.atproto.repo.strongRef', ...ref}) as ReportSubject
const enumerate = (refs: Ref[] | undefined) =>
  getAssociatedReportSubjects(refs as com.atproto.repo.strongRef.Main[])

describe('getAssociatedReportSubjects', () => {
  const at = (collection: string, rkey = '3kabc') =>
    `${REPO}/${collection}/${rkey}`

  it.each([
    ['site.standard.document', 'article'],
    ['site.standard.publication', 'publication'],
    ['social.grain.photo', 'photo'],
    ['social.grain.gallery', 'gallery'],
    ['place.stream.livestream', 'livestream'],
    ['place.stream.livestream.extra', 'record'],
    ['social.grain.gallery.item', 'record'],
    ['site.standard.document.extra', 'record'],
    ['example.site.standard.publication', 'record'],
    ['app.test.unknown', 'record'],
  ])('classifies %s as %s by exact collection', (collection, type) => {
    const ref = {uri: at(collection), cid: CID_A}
    expect(enumerate([ref])).toEqual([
      {
        subject: {$type: 'com.atproto.repo.strongRef', ...ref},
        parsedSubject: {type, nsid: collection, ...ref},
      },
    ])
  })

  it('keeps distinct records in response order', () => {
    const refs = [
      {uri: at('site.standard.publication'), cid: CID_B},
      {uri: at('site.standard.document', '3kone'), cid: CID_A},
      {uri: at('site.standard.document', '3ktwo'), cid: CID_B},
    ]
    expect(enumerate(refs).map(t => t.subject)).toEqual(
      refs.map(ref => ({$type: 'com.atproto.repo.strongRef', ...ref})),
    )
  })

  it('skips invalid refs and keeps the first valid ref for a URI', () => {
    const uri = at('site.standard.document')
    const targets = enumerate([
      {uri, cid: 'not-a-cid'},
      {uri: 'https://example.com/ref', cid: CID_A},
      {uri, cid: CID_A},
      {uri, cid: CID_B},
    ])
    expect(targets).toHaveLength(1)
    expect(targets[0].subject).toMatchObject({uri, cid: CID_A})
  })

  it('does not mutate its input', () => {
    const refs = [first, {uri: first.uri, cid: CID_B}, second].map(ref =>
      Object.freeze({...ref}),
    )
    const copy = refs.map(ref => ({...ref}))
    enumerate(refs)
    expect(refs).toEqual(copy)
  })

  it('has nothing to report without valid refs', () => {
    expect(enumerate(undefined)).toEqual([])
    expect(enumerate([])).toEqual([])
    expect(enumerate([{uri: REPO, cid: CID_A}])).toEqual([])
  })
})

it('keeps place.stream livestreams out of the Bluesky-only subject types', () => {
  const [target] = enumerate([
    {uri: `${REPO}/place.stream.livestream/3kabc`, cid: CID_A},
  ])
  expect(target.parsedSubject.type).toBe('livestream')
  expect(BSKY_LABELER_ONLY_SUBJECT_TYPES.has('livestream')).toBe(false)
  expect(BSKY_LABELER_ONLY_SUBJECT_TYPES.has('status')).toBe(true)
})
