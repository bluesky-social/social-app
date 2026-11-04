import {describe, expect, it, jest} from '@jest/globals'

import {type app} from '#/lexicons'
import {parseReportSubject} from './parseReportSubject'

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
    expect(parseReportSubject(article(refs))).toEqual({
      type: 'article',
      uri: first.uri,
      cid: first.cid,
      nsid: 'app.test.first',
    })
    expect(parseReportSubject(photo(refs))).toEqual({
      type: 'photo',
      uri: first.uri,
      cid: first.cid,
      nsid: 'app.test.first',
    })
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
