import {type ActivityCardRow, type TimelineEntry, toActivityRows} from '../rows'
import {
  actorGroup,
  article,
  caelin,
  danielle,
  debbie,
  eric,
  gallery,
  item,
  livestream,
  manton,
  NSID,
  paul,
  publication,
  recommendBucket,
  subjectGroup,
} from './fixtures'

const profiles = new Map([debbie, eric, manton].map(p => [p.did, p]))

function rowsOf(...feed: TimelineEntry[]) {
  return toActivityRows(feed, profiles, 0)
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
          recommendBucket([danielle, caelin, paul]),
          // Shares are vestigial; only recommend buckets render.
          {...recommendBucket([paul]), collection: 'app.bsky.feed.post'},
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
    expect(row.related).toEqual([
      {collection: NSID.recommend, actors: [danielle, caelin, paul]},
    ])
  })

  it('maps an actor group to its actor, newest card, and activity count', () => {
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
  })

  it('maps a subject group to its first actor and the other actor count', () => {
    const row = cardOf(
      subjectGroup({
        actors: [danielle, caelin, paul],
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
    const rows = rowsOf(
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
      {$type: 'app.bsky.unspecced.getAtmosphereTimeline#somethingNew'} as never,
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
      $type: 'app.bsky.unspecced.getAtmosphereTimeline#somethingNew',
    } as never
    const [first] = toActivityRows([unknown], profiles, 0)
    const [second] = toActivityRows([unknown], profiles, 1)
    expect(first.key).not.toBe(second.key)
  })
})
