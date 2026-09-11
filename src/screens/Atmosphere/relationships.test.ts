import {
  getActivityDocumentUri,
  getFirstActivity,
  getShareDocumentUri,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
import {
  createActivity,
  createActor,
  createRecord,
  createRow,
  createShareRecord,
  documentUri,
  publicationUri,
  recordCid,
} from '#/screens/Atmosphere/testFixtures'
import {activityCollections, isShareRecord} from '#/screens/Atmosphere/types'

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
      expect(isShareRecord(record)).toBe(true)
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

  it('validates raw excerpt fields and facets without requiring a hydrated post', () => {
    const facets = [
      {
        index: {byteStart: 0, byteEnd: 4},
        features: [
          {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
        ],
      },
    ]
    const record = {...createShareRecord(), facets}
    expect(isShareRecord(record)).toBe(true)
    expect(record.facets).toBe(facets)
    expect(isShareRecord({...record, text: ''})).toBe(true)
    expect(isShareRecord({...record, text: 12})).toBe(false)
    expect(isShareRecord({...record, createdAt: undefined})).toBe(false)
    expect(isShareRecord({...record, facets: [null]})).toBe(false)
    expect(isShareRecord({...record, facets: 'not an array'})).toBe(false)
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
      share.record.uri = uri
      expect(getSharePostHref(share, createActor())).toBeUndefined()
    },
  )

  it('dispatches from the supplied collection and retains the first group child', () => {
    const share = createActivity({collection: activityCollections.share})
    const record = createRecord(share.record.uri, createShareRecord())
    expect(getActivityDocumentUri(share, {[record.uri]: record})).toBe(
      documentUri,
    )
    expect(
      getActivityDocumentUri(
        {...share, collection: 'example.other.record'},
        {[record.uri]: record},
      ),
    ).toBeUndefined()
    const later = createActivity({rkey: 'later'})
    const row = createRow([share, later], {groupBy: 'actor'})
    expect(getFirstActivity(row)).toBe(share)
    expect(getFirstActivity(createRow([later]))).toBe(later)
  })
})
