import {parseReportSubject} from './parseReportSubject'

describe('parseReportSubject', () => {
  it.each(['site.standard.document', 'com.example.article'])(
    'parses a strong ref to %s as a generic record',
    collection => {
      const uri = `at://did:plc:author/${collection}/article` as const
      expect(
        parseReportSubject({
          $type: 'com.atproto.repo.strongRef',
          uri,
          cid: 'article-cid',
        }),
      ).toEqual({
        type: 'record',
        uri,
        cid: 'article-cid',
        nsid: collection,
      })
    },
  )

  it('preserves specialized subjects for existing views', () => {
    expect(
      parseReportSubject({
        $type: 'app.bsky.feed.defs#generatorView',
        uri: 'at://did:plc:author/app.bsky.feed.generator/feed',
        cid: 'feed-cid',
        did: 'did:plc:generator',
        creator: {did: 'did:plc:author', handle: 'author.test'},
        displayName: 'Feed',
        indexedAt: '2026-01-01T00:00:00Z',
      }),
    ).toEqual({
      type: 'feed',
      uri: 'at://did:plc:author/app.bsky.feed.generator/feed',
      cid: 'feed-cid',
      nsid: 'app.bsky.feed.generator',
    })
  })
})
