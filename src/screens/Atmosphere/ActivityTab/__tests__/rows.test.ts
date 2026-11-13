import {type ActivityCardRow, type TimelineEntry, toActivityRows} from '../rows'
import {
  actorGroup,
  article,
  caelin,
  danielle,
  debbie,
  eric,
  everyone,
  gallery,
  item,
  label,
  livestream,
  manton,
  moderationOpts,
  NSID,
  page,
  paul,
  profile,
  publication,
  recordUri,
  related,
  subjectGroup,
} from './fixtures'

function rowsOf(...feed: TimelineEntry[]) {
  return toActivityRows(page(feed), 0, moderationOpts)
}

function cardOf(entry: TimelineEntry): ActivityCardRow {
  const [row] = rowsOf(entry)
  if (row.kind !== 'card') throw new Error(`expected card, got ${row.reason}`)
  return row
}

describe('toActivityRows', () => {
  it('maps a standalone item to a single-actor card with related recommends', () => {
    const row = cardOf(
      item({
        actor: debbie,
        collection: NSID.document,
        view: article(),
        relatedActivity: [
          ...related([danielle, caelin, paul]),
          // Only recommends render as pills.
          ...related([eric], 'app.bsky.feed.post'),
        ],
      }),
    )
    expect(row).toMatchObject({
      collection: NSID.document,
      actor: debbie,
      otherActorCount: 0,
      activityCount: 1,
      content: {type: 'article'},
    })
    expect(row.subjectUris).toBeUndefined()
    expect(row.related).toEqual([
      {
        collection: NSID.recommend,
        actors: [danielle, caelin, paul],
        actorCount: 3,
      },
    ])
  })

  it('counts every distinct recommender, even those without a profile', () => {
    const stranger = profile('stranger.example.com')
    const row = cardOf(
      item({
        actor: debbie,
        collection: NSID.document,
        view: article(),
        relatedActivity: related([danielle, caelin, danielle, stranger]),
      }),
    )
    expect(row.related).toEqual([
      {collection: NSID.recommend, actors: [danielle, caelin], actorCount: 3},
    ])
  })

  it('maps an actor group to its actor, newest card, and subjects', () => {
    const row = cardOf(
      actorGroup({
        actor: eric,
        collection: NSID.recommend,
        view: article('paul.pckt.blog'),
        count: 16,
      }),
    )
    expect(row).toMatchObject({
      collection: NSID.recommend,
      actor: eric,
      otherActorCount: 0,
      activityCount: 16,
      content: {type: 'article'},
    })
    // View all lists the recommended articles, not the recommend records.
    expect(row.subjectUris).toHaveLength(16)
    expect(row.subjectUris?.[0]).toBe(recordUri(paul, NSID.document, '0'))
  })

  it('maps a subject group to its newest actor and the other actor count', () => {
    const row = cardOf(
      subjectGroup({
        actors: [danielle, caelin, danielle, paul],
        collection: NSID.recommend,
        view: article('caelin.pckt.blog'),
      }),
    )
    expect(row).toMatchObject({
      actor: danielle,
      otherActorCount: 2,
      activityCount: 1,
    })
  })

  it.each([
    [NSID.subscription, publication(), 'publication'],
    [NSID.gallery, gallery(), 'gallery'],
    [NSID.livestream, livestream(), 'livestream'],
  ] as const)('maps %s to %s content', (collection, view, type) => {
    const actor = collection === NSID.gallery ? manton : debbie
    expect(cardOf(item({actor, collection, view}))).toMatchObject({
      collection,
      content: {type},
    })
  })

  it('warns instead of dropping entries it cannot render', () => {
    const rows = toActivityRows(
      page(
        [
          item({
            actor: debbie,
            collection: 'social.grain.favorite',
            view: gallery(),
          }),
          item({actor: debbie, collection: NSID.document, view: gallery()}),
          item({actor: paul, collection: NSID.document, view: article()}),
          item({
            actor: manton,
            collection: NSID.gallery,
            view: {...gallery(), items: []},
          }),
          {
            $type: 'app.bsky.unspecced.getAtmosphereTimelineV2#somethingNew',
          } as never,
        ],
        everyone.filter(p => p !== paul),
      ),
      0,
      moderationOpts,
    )
    expect(rows.map(row => row.kind === 'warning' && row.reason)).toEqual([
      'unsupported-entry',
      'unexpected-content',
      'missing-actor',
      'unexpected-content',
      'unsupported-entry',
    ])
    expect(new Set(rows.map(row => row.key)).size).toBe(rows.length)
  })

  it('keeps fallback keys unique across pages', () => {
    const unknown = {
      $type: 'app.bsky.unspecced.getAtmosphereTimelineV2#somethingNew',
    } as never
    const [first] = toActivityRows(page([unknown]), 0, moderationOpts)
    const [second] = toActivityRows(page([unknown]), 1, moderationOpts)
    expect(first.key).not.toBe(second.key)
  })
})

describe('toActivityRows moderation', () => {
  function documentBy(actor = debbie, view = article()) {
    return item({actor, collection: NSID.document, view})
  }

  it('drops cards hidden by a !hide label', () => {
    expect(
      rowsOf(
        documentBy(debbie, article(undefined, {labels: [label('!hide')]})),
      ),
    ).toEqual([])
  })

  it('keeps cards the user can click through, with their blur', () => {
    const row = cardOf(
      documentBy(debbie, article(undefined, {labels: [label('!warn')]})),
    )
    expect(row.moderation.blur).toBe(true)
    expect(row.moderation.noOverride).toBe(false)
  })

  it('drops cards filtered from lists, such as a muted actor', () => {
    const muted = {...debbie, viewer: {muted: true}}
    expect(
      toActivityRows(page([documentBy(muted)], [muted]), 0, moderationOpts),
    ).toEqual([])
  })

  it('leaves moderated recommenders out of the pill but keeps their count', () => {
    const muted = {...danielle, viewer: {muted: true}}
    const withRecommenders = (actors: (typeof danielle)[]) => {
      const [row] = toActivityRows(
        page(
          [
            item({
              actor: debbie,
              collection: NSID.document,
              view: article(),
              relatedActivity: related(actors),
            }),
          ],
          [debbie, ...actors],
        ),
        0,
        moderationOpts,
      )
      return row.kind === 'card' ? row.related : undefined
    }

    expect(withRecommenders([muted, caelin, paul])).toEqual([
      {collection: NSID.recommend, actors: [caelin, paul], actorCount: 3},
    ])
    // With nobody left to name, there's no pill.
    expect(withRecommenders([muted])).toEqual([])
  })

  it('leads a subject group with its newest visible actor', () => {
    const muted = {...danielle, viewer: {muted: true}}
    const groupOf = (actors: (typeof danielle)[]) =>
      toActivityRows(
        page(
          [
            subjectGroup({
              actors,
              collection: NSID.recommend,
              view: article('caelin.pckt.blog'),
            }),
          ],
          actors,
        ),
        0,
        moderationOpts,
      )

    expect(groupOf([muted, caelin, paul])).toMatchObject([
      {kind: 'card', actor: caelin, otherActorCount: 2},
    ])
    // With nobody visible to lead, the group is dropped.
    expect(groupOf([muted, {...paul, viewer: {muted: true}}])).toEqual([])
  })

  it('drops an article when its publisher is hidden', () => {
    const view = article()
    view.publisher = {...view.publisher!, labels: [label('!hide')]}
    expect(rowsOf(documentBy(debbie, view))).toEqual([])
  })
})
