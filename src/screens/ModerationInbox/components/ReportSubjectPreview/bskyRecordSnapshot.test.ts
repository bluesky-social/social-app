import {AtUri} from '@atproto/syntax'

import {
  canShowBskyRecordSnapshot,
  getBskyRecordSnapshot,
} from './bskyRecordSnapshot'

jest.unmock('multiformats/cid')

const did = 'did:plc:abcdefghijklmnopqrstuvwx'
const createdAt = '2026-01-01T12:00:00.000Z'
const post = {
  $type: 'app.bsky.feed.post',
  createdAt,
  langs: ['en'],
  text: 'Example reported post',
}
const uri = new AtUri(`at://${did}/app.bsky.feed.post/3example`)
const subject = {
  $type: 'com.atproto.repo.strongRef',
  uri: uri.toString(),
  cid: 'bafyreif5n5m2ol4zppdwjwfcq36xsoqoxn2k2bnaineijucvhkpmh6of2q',
} as const

describe('record-backed report previews', () => {
  it('uses the post text returned by getReport when the post is unavailable', () => {
    expect(canShowBskyRecordSnapshot(uri, {subject, record: post})).toBe(true)
    expect(getBskyRecordSnapshot(uri.collection, post)).toMatchObject({
      kind: 'post',
      text: 'Example reported post',
      createdAt,
    })
  })

  it.each([
    [
      'app.bsky.feed.generator',
      {
        $type: 'app.bsky.feed.generator',
        did,
        displayName: 'Feed',
        description: 'Feed text',
        createdAt,
      },
      'feed',
    ],
    [
      'app.bsky.graph.list',
      {
        $type: 'app.bsky.graph.list',
        name: 'List',
        purpose: 'app.bsky.graph.defs#curatelist',
        description: 'List text',
        createdAt,
      },
      'list',
    ],
    [
      'app.bsky.graph.starterpack',
      {
        $type: 'app.bsky.graph.starterpack',
        name: 'Pack',
        list: `at://${did}/app.bsky.graph.list/3k2`,
        description: 'Pack text',
        createdAt,
      },
      'starterPack',
    ],
    [
      'app.bsky.actor.status',
      {
        $type: 'app.bsky.actor.status',
        status: 'app.bsky.actor.status#live',
        createdAt,
      },
      'liveStatus',
    ],
  ])('extracts a supported %s record', (collection, record, kind) => {
    expect(getBskyRecordSnapshot(collection, record)).toMatchObject({kind})
  })

  it('rejects mismatched, invalid, unsupported, and textless records', () => {
    expect(getBskyRecordSnapshot('app.bsky.graph.list', post)).toBeUndefined()
    expect(
      getBskyRecordSnapshot(uri.collection, {...post, text: ''}),
    ).toBeUndefined()
    expect(
      getBskyRecordSnapshot(uri.collection, {...post, createdAt: null}),
    ).toBeUndefined()
    expect(
      getBskyRecordSnapshot('app.bsky.unknown.record', post),
    ).toBeUndefined()
    expect(canShowBskyRecordSnapshot(uri, {subject, record: undefined})).toBe(
      false,
    )
  })

  it('retains self-labels for moderation', () => {
    const labels = {
      $type: 'com.atproto.label.defs#selfLabels',
      values: [{val: 'porn'}],
    }
    expect(
      getBskyRecordSnapshot(uri.collection, {...post, labels}),
    ).toMatchObject({
      labels: [{val: 'porn'}],
    })
  })
})
