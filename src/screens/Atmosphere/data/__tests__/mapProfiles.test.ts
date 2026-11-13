import {
  article,
  caelin,
  danielle,
  debbie,
  eric,
  gallery,
  item,
  livestream,
  manton,
  moderationOpts,
  NSID,
  paul,
  publication,
  recommendBucket,
  recordUri,
  subjectGroup,
} from '#/screens/Atmosphere/ActivityTab/__tests__/fixtures'
import {
  type TimelineEntry,
  toActivityRows,
} from '#/screens/Atmosphere/ActivityTab/rows'
import {type app} from '#/lexicons'
import {getAtmosphereArticles} from '../exploreData'
import {
  findProfiles,
  mapExploreProfiles,
  mapTimelinePageProfiles,
  type ProfileMapper,
} from '../mapProfiles'

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

type ExploreTab = app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody

function explore(views: {
  articles?: app.bsky.embed.external.ViewArticle[]
  publications?: app.bsky.embed.external.ViewArticlePublication[]
  photos?: app.bsky.embed.external.ViewGallery[]
  livestreams?: app.bsky.embed.external.ViewLivestream[]
}): ExploreTab {
  const section = (items: object[] = []) => ({
    items: items.map(view => ({view})),
  })
  return {
    articles: section(views.articles),
    publications: section(views.publications),
    photos: section(views.photos),
    livestreams: section(views.livestreams),
    apps: [],
  } as unknown as ExploreTab
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
            likers: [manton],
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
    ).toHaveLength(7)
  })

  it('finds a profile everywhere it appears in the Explore tab', () => {
    const data = explore({
      articles: [article(undefined, {associatedProfiles: [manton]})],
      publications: [{...publication(), subscribers: [manton]}],
      photos: [{...gallery(manton), likers: [manton]}],
      livestreams: [livestream({associatedProfiles: [manton]})],
    })
    expect(
      findProfiles(manton.did, map => mapExploreProfiles(data, map)),
    ).toHaveLength(5)
  })
})

describe('mapExploreProfiles', () => {
  it('drops an article whose author was blocked elsewhere', () => {
    const data = explore({
      articles: [
        article(undefined, {
          // Moderation takes the owner from the first backing record.
          associatedRefs: [
            {uri: recordUri(manton, NSID.document), cid: 'bafycid'},
          ],
          associatedProfiles: [manton],
        }),
      ],
    })
    const articlesWith = (map: ProfileMapper) =>
      getAtmosphereArticles(mapExploreProfiles(data, map), moderationOpts)
    expect(articlesWith(shadowing({}))).toHaveLength(1)
    expect(articlesWith(shadowing({[manton.did]: blocked}))).toEqual([])
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
