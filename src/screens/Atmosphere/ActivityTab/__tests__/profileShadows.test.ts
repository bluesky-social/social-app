import {type ProfileShadows, shadowTimelinePage} from '../profileShadows'
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
} from './fixtures'

/*
 * The real module imports every query in the app. These tests only need the
 * mute and block fields merged into `viewer`.
 */
jest.mock('#/state/cache/profile-shadow', () => ({
  mergeShadow: (
    profile: {viewer?: object},
    shadow: {muted?: boolean; blockingUri?: string},
  ) => ({
    ...profile,
    viewer: {
      ...profile.viewer,
      muted: shadow.muted,
      blocking: shadow.blockingUri,
    },
  }),
}))

const profiles = new Map([debbie, eric].map(p => [p.did, p]))

function rowsOf(shadows: ProfileShadows, ...feed: TimelineEntry[]) {
  const page = shadowTimelinePage({feed, profiles}, shadows)
  return toActivityRows(page.feed, page.profiles, 0, moderationOpts)
}

const muted = {muted: true}
const blocked = {blockingUri: 'at://did:plc:me/app.bsky.graph.block/1'}

describe('shadowTimelinePage', () => {
  it('leaves the page alone without shadows', () => {
    const page = {feed: [], profiles}
    expect(shadowTimelinePage(page, new Map())).toBe(page)
  })

  it('drops activity by an actor muted elsewhere', () => {
    const entry = item({
      actor: debbie,
      collection: NSID.document,
      view: article(),
    })
    expect(rowsOf(new Map(), entry)).toHaveLength(1)
    expect(rowsOf(new Map([[debbie.did, muted]]), entry)).toEqual([])
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
    expect(rowsOf(new Map(), entry)).toHaveLength(1)
    expect(rowsOf(new Map([[manton.did, blocked]]), entry)).toEqual([])
  })

  it('takes a recommender muted elsewhere out of the pill', () => {
    const [row] = rowsOf(
      new Map([[danielle.did, muted]]),
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
