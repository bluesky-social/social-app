import {
  findProfiles,
  mapTimelinePageProfiles,
  type ProfileMapper,
} from '../mapProfiles'
import {type TimelineEntry, toActivityRows} from '../rows'
import {
  article,
  caelin,
  danielle,
  debbie,
  eric,
  item,
  manton,
  moderationOpts,
  NSID,
  paul,
  recommendBucket,
  recordUri,
  subjectGroup,
} from './fixtures'

const profiles = new Map([debbie, eric].map(p => [p.did, p]))

/** Stands in for profile shadows: these DIDs come back with `viewer` changed. */
function shadowing(viewers: Record<string, object>): ProfileMapper {
  return profile =>
    viewers[profile.did]
      ? {...profile, viewer: {...profile.viewer, ...viewers[profile.did]}}
      : profile
}

function rowsOf(map: ProfileMapper, ...feed: TimelineEntry[]) {
  const page = mapTimelinePageProfiles({feed, profiles}, map)
  return toActivityRows(page.feed, page.profiles, 0, moderationOpts)
}

const muted = {muted: true}
const blocked = {blocking: 'at://did:plc:me/app.bsky.graph.block/1'}

describe('findProfiles', () => {
  it('finds a profile everywhere it appears in a timeline page', () => {
    const owned = {associatedProfiles: [manton]}
    const page = {
      profiles: new Map([[manton.did, manton]]),
      feed: [
        item({
          actor: eric,
          collection: NSID.recommend,
          view: article(undefined, {
            ...owned,
            publisher: {...article().publisher!, ...owned},
          }),
          relatedActivity: [recommendBucket([manton, paul])],
        }),
        subjectGroup({
          actors: [manton, caelin],
          collection: NSID.recommend,
          view: article(undefined, owned),
        }),
      ],
    }
    expect(
      findProfiles(manton.did, map => mapTimelinePageProfiles(page, map)),
    ).toHaveLength(6)
  })
})

describe('mapTimelinePageProfiles', () => {
  it('drops activity by an actor muted elsewhere', () => {
    const entry = item({
      actor: debbie,
      collection: NSID.document,
      view: article(),
    })
    expect(rowsOf(shadowing({}), entry)).toHaveLength(1)
    expect(rowsOf(shadowing({[debbie.did]: muted}), entry)).toEqual([])
  })

  it('drops a recommended article whose author was blocked elsewhere', () => {
    const entry = item({
      actor: eric,
      collection: NSID.recommend,
      view: article(undefined, {
        // Moderation takes the owner from the first backing record.
        associatedRefs: [
          {uri: recordUri(manton, NSID.document), cid: 'bafycid'},
        ],
        associatedProfiles: [manton],
      }),
    })
    expect(rowsOf(shadowing({}), entry)).toHaveLength(1)
    expect(rowsOf(shadowing({[manton.did]: blocked}), entry)).toEqual([])
  })

  it('takes a recommender muted elsewhere out of the pill', () => {
    const [row] = rowsOf(
      shadowing({[danielle.did]: muted}),
      item({
        actor: debbie,
        collection: NSID.document,
        view: article(),
        relatedActivity: [recommendBucket([danielle, caelin, paul])],
      }),
    )
    expect(row.kind === 'card' && row.related).toEqual([
      {collection: NSID.recommend, actors: [caelin, paul], actorCount: 3},
    ])
  })
})
