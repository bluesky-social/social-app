import {type l} from '@atproto/lex'

import {
  getActivityContent,
  getActivityCount,
  getActivityDocumentUri,
  getFirstActivity,
  getShareDocumentUri,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
import {
  createActivity,
  createActor,
  createActorGroup,
  createArticleView,
  createPostView,
  createRow,
  createShareRecord,
  createSubjectGroup,
  documentUri,
  publicationUri,
  recordCid,
} from '#/screens/Atmosphere/testFixtures'
import {
  activityCollections,
  type ActivityItem,
} from '#/screens/Atmosphere/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

// The global CID mock cannot validate real strong-reference CIDs.
jest.unmock('multiformats/cid')

function withRefs(associatedRefs: unknown) {
  return {
    ...createShareRecord(),
    embed: {
      $type: 'app.bsky.embed.external',
      external: {associatedRefs},
    },
  }
}

describe('Atmosphere share relationships', () => {
  it.each([false, true])(
    'resolves external document refs (recordWithMedia=%s)',
    wrapped => {
      const record = createShareRecord(documentUri, wrapped)
      expect(getShareDocumentUri(record)).toBe(documentUri)
      expect(bsky.matches(app.bsky.feed.post, record)).toBe(true)
    },
  )

  it('skips unrelated and malformed refs and chooses the first valid document', () => {
    expect(
      getShareDocumentUri(
        withRefs([
          null,
          {uri: documentUri},
          {uri: documentUri, cid: 1},
          {uri: documentUri, cid: 'invalid-cid'},
          {uri: publicationUri, cid: recordCid},
          {uri: 'https://example.com/article', cid: recordCid},
          {uri: 'at://did:plc:author/site.standard.document', cid: recordCid},
          {
            uri: 'at://author.example/site.standard.document/article',
            cid: recordCid,
          },
          {uri: `${documentUri}#fragment`, cid: recordCid},
          {uri: documentUri, cid: recordCid},
          {uri: `${documentUri}-later`, cid: recordCid},
        ]),
      ),
    ).toBe(documentUri)
  })

  it.each([
    null,
    [],
    {},
    {...createShareRecord(), $type: 'example.other.record'},
    {...createShareRecord(), embed: undefined},
    {
      ...createShareRecord(),
      embed: {external: {associatedRefs: [{uri: documentUri, cid: recordCid}]}},
    },
    {
      ...createShareRecord(),
      embed: {$type: 'app.bsky.embed.images', images: []},
    },
    {
      ...createShareRecord(),
      embed: {$type: 'app.bsky.embed.external', external: null},
    },
    withRefs(undefined),
    withRefs({uri: documentUri, cid: recordCid}),
    withRefs([{uri: publicationUri, cid: recordCid}]),
    {
      ...createShareRecord(),
      embed: {
        $type: 'app.bsky.embed.recordWithMedia',
        media: {$type: 'app.bsky.embed.images', images: []},
        record: {
          $type: 'app.bsky.embed.record',
          record: {uri: documentUri, cid: recordCid},
        },
      },
    },
  ])(
    'does not infer a document from invalid or unrelated content (%#)',
    record => {
      expect(getShareDocumentUri(record)).toBeUndefined()
    },
  )

  it('ignores article URLs in text and external URI without an associated ref', () => {
    const record = createShareRecord()
    record.text = documentUri
    expect(
      getShareDocumentUri({
        ...record,
        embed: {$type: 'app.bsky.embed.external', external: {uri: documentUri}},
      }),
    ).toBeUndefined()
  })

  it('uses the generated post schema for supplied excerpt fields and facets', () => {
    const facets = [
      {
        index: {byteStart: 0, byteEnd: 4},
        features: [
          {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
        ],
      },
    ]
    const record = {...createShareRecord(), facets}
    expect(bsky.matches(app.bsky.feed.post, record)).toBe(true)
    expect(record.facets).toBe(facets)
    expect(bsky.matches(app.bsky.feed.post, {...record, text: ''})).toBe(true)
    expect(bsky.matches(app.bsky.feed.post, {...record, text: 12})).toBe(false)
    expect(
      bsky.matches(app.bsky.feed.post, {...record, createdAt: undefined}),
    ).toBe(false)
    expect(bsky.matches(app.bsky.feed.post, {...record, facets: [null]})).toBe(
      false,
    )
    expect(
      bsky.matches(app.bsky.feed.post, {...record, facets: 'not an array'}),
    ).toBe(false)
  })

  it('builds the real sharing actor’s thread link independently of the article target', () => {
    const share = createActivity({
      collection: activityCollections.share,
      rkey: 'post',
    })
    expect(getSharePostHref(share, createActor())).toBe(
      '/profile/author.example/post/post',
    )
    expect(
      getSharePostHref(share, createActor('did:plc:other')),
    ).toBeUndefined()
    expect(
      getSharePostHref(
        {...share, collection: activityCollections.document},
        createActor(),
      ),
    ).toBeUndefined()
  })

  it.each(['not-a-uri', documentUri, 'at://did:plc:author/app.bsky.feed.post'])(
    'does not build a thread from invalid source %s',
    uri => {
      const share = createActivity({collection: activityCollections.share})
      share.record.uri = uri as ActivityItem['record']['uri']
      expect(getSharePostHref(share, createActor())).toBeUndefined()
    },
  )

  it('dispatches from the supplied collection and retains the first group child', () => {
    const share = createActivity({
      collection: activityCollections.share,
      view: createPostView(),
    })
    expect(getActivityDocumentUri(share)).toBe(documentUri)
    expect(
      getActivityDocumentUri({...share, collection: 'example.other.record'}),
    ).toBeUndefined()
    const later = createActivity({rkey: 'later'})
    const row = createRow([share, later], {groupBy: 'actor'})
    expect(getFirstActivity(row)).toBe(share)
    expect(getFirstActivity(createRow([later]))).toBe(later)
  })
  it('resolves recommendation targets from hydrated refs and never substitutes missing views', () => {
    const recommendation = createActivity({
      collection: activityCollections.recommendation,
      view: createArticleView(),
    })
    expect(getActivityDocumentUri(recommendation)).toBe(documentUri)
    recommendation.view = createArticleView({
      associatedRefs: [{uri: publicationUri, cid: recordCid}],
    })
    expect(getActivityDocumentUri(recommendation)).toBeUndefined()
    recommendation.view = {$type: 'example.future#view' as l.Unknown$Type}
    expect(getActivityDocumentUri(recommendation)).toBeUndefined()
  })

  it('keeps actor-group content hydrated and counts all supplied URIs', () => {
    const first = createActivity()
    const second = createActivity({rkey: 'second'})
    const group = createActorGroup([first, second])
    const row = {type: 'group' as const, key: group.id, group, actors: {}}
    expect(getFirstActivity(row)).toBe(first)
    expect(getActivityContent(row)).toBe(first)
    expect(getActivityCount(row)).toBe(2)
    expect(getActivityCount(createRow([first]))).toBe(1)
  })

  it('keeps shared subjects separate from reference-only first activities', () => {
    const group = createSubjectGroup(
      [
        createActivity({
          collection: activityCollections.recommendation,
          did: 'did:plc:one',
        }),
        createActivity({
          collection: activityCollections.recommendation,
          did: 'did:plc:two',
        }),
      ],
      {
        uri: documentUri,
        viewerState: {subscribed: false},
        view: createArticleView(),
      },
    )
    const row = {type: 'group' as const, key: group.id, group, actors: {}}
    expect(getFirstActivity(row)).toBe(group.activities[0])
    expect(getFirstActivity(row)).not.toHaveProperty('view')
    expect(getActivityContent(row)).toBe(group.subject)
    expect(getActivityDocumentUri(group.subject)).toBe(documentUri)
    expect(getActivityCount(row)).toBe(2)
    group.activities = []
    expect(getFirstActivity(row)).toBeUndefined()
    expect(getActivityContent(row)).toBe(group.subject)
    expect(getActivityCount(row)).toBe(0)
  })
})
