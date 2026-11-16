import {type $Typed} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'

import {type app, type com} from '#/lexicons'
import {type TimelineEntry, type TimelinePage} from '../rows'

type Profile = app.bsky.actor.defs.ProfileViewBasic
type View = app.bsky.unspecced.getAtmosphereTimelineV2.ActivitySubject['view']
type RelatedActivity =
  app.bsky.unspecced.getAtmosphereTimelineV2.ActivityItemRelatedActivity

export const NSID = {
  document: 'site.standard.document',
  recommend: 'site.standard.graph.recommend',
  subscription: 'site.standard.graph.subscription',
  gallery: 'social.grain.gallery',
  livestream: 'place.stream.livestream',
} as const

export const LABELER = 'did:web:labeler.test' as const

export const moderationOpts: ModerationOpts = {
  userDid: 'did:web:viewer.test',
  prefs: {
    adultContentEnabled: false,
    labels: {},
    labelers: [{did: LABELER, labels: {}}],
    mutedWords: [],
    hiddenPosts: [],
  },
}

/** A label on `uri` from the test labeler. */
export function label(
  val: string,
  uri: com.atproto.label.defs.Label['uri'] = 'https://example.com/content',
): com.atproto.label.defs.Label {
  return {src: LABELER, uri, val, cts: '2026-01-01T00:00:00.000Z'}
}

export function profile(handle: string, displayName?: string): Profile {
  return {
    $type: 'app.bsky.actor.defs#profileViewBasic',
    did: `did:plc:${handle.split('.')[0]}`,
    handle: handle as Profile['handle'],
    displayName,
  }
}

export const debbie = profile('debbie.example.com', 'Debbie Ridpath Ohi')
export const danielle = profile('danielle.example.com', 'Danielle Yuhan')
export const caelin = profile('caelin.example.com', 'caelin')
export const paul = profile('paul.example.com', 'Paul')
export const eric = profile('eric.example.com', 'Eric')
export const manton = profile('manton.example.com', 'Manton Reece')
export const camp = profile('pdx.atproto.camp')

/** Everyone above, as the timeline's `relatedViews`. */
export const everyone = [debbie, danielle, caelin, paul, eric, manton, camp]

/** A timeline page whose `relatedViews` holds `profiles`. */
export function page(
  feed: TimelineEntry[],
  profiles: Profile[] = everyone,
): TimelinePage {
  return {feed, relatedViews: profiles} as TimelinePage
}

export function article(
  host = 'debbie.leaflet.pub',
  overrides: Partial<app.bsky.embed.external.ViewArticle> = {},
): $Typed<app.bsky.embed.external.ViewArticle> {
  return {
    $type: 'app.bsky.embed.external#viewArticle',
    uri: `https://${host}/post`,
    title: 'Why I switched from Goodreads to Hardcover',
    description: 'POLL: What book tracking app do YOU use?',
    publisher: {
      uri: `https://${host}`,
      title: 'Debbie’s Blatherings',
      description: '',
    },
    ...overrides,
  }
}

export function publication(): $Typed<app.bsky.embed.external.ViewArticlePublication> {
  return {
    $type: 'app.bsky.embed.external#viewArticlePublication',
    uri: 'https://paul.leaflet.pub',
    title: 'Paul’s Leaflets',
    description: '',
  }
}

export function gallery(
  author: Profile = manton,
): $Typed<app.bsky.embed.external.ViewGallery> {
  return {
    $type: 'app.bsky.embed.external#viewGallery',
    uri: 'https://grain.social/manton/gallery/1',
    title: '168th street station.',
    description: '',
    items: [
      {
        $type: 'app.bsky.embed.external#viewGalleryImage',
        thumbnail: 'https://cdn.example.com/thumb.jpg',
        fullsize: 'https://cdn.example.com/full.jpg',
        alt: 'A subway station',
      },
    ],
    associatedProfiles: [author],
  }
}

export function livestream(
  overrides: Partial<app.bsky.embed.external.ViewLivestream> = {},
): $Typed<app.bsky.embed.external.ViewLivestream> {
  return {
    $type: 'app.bsky.embed.external#viewLivestream',
    uri: 'https://stream.place/pdx.atproto.camp',
    title: 'October ’26 Meetup',
    description: 'Tonight we hung out',
    active: false,
    startedAt: '2026-11-09T00:00:00.000Z',
    endedAt: '2026-11-09T03:50:23.000Z',
    associatedProfiles: [camp],
    ...overrides,
  }
}

export function recordUri(
  actor: Profile,
  collection: string,
  rkey = '1',
): AtUriString {
  return `at://${actor.did}/${collection}/${rkey}`
}

const INDEXED_AT = '2026-11-11T12:00:00.000Z'

function strongRef(uri: AtUriString) {
  return {uri, cid: 'bafycid'}
}

function subject(view: View, uri = recordUri(paul, NSID.document)) {
  return {ref: strongRef(uri), view}
}

export function item({
  actor,
  collection,
  view,
  rkey,
  relatedActivity,
}: {
  actor: Profile
  collection: string
  view: View
  rkey?: string
  relatedActivity?: RelatedActivity[]
}): TimelineEntry {
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimelineV2#activityItem',
    ref: strongRef(recordUri(actor, collection, rkey)),
    collection,
    indexedAt: INDEXED_AT,
    actor: actor.did,
    subject: subject(view),
    relatedActivity,
  } as TimelineEntry
}

/**
 * Published documents are their own subjects; anything else targets one of
 * Paul's articles.
 */
export function actorGroup({
  actor,
  collection,
  view,
  count,
}: {
  actor: Profile
  collection: string
  view: View
  count: number
}): TimelineEntry {
  const activities = Array.from({length: count}, (_, i) => {
    const uri = recordUri(actor, collection, String(i))
    return {
      ref: strongRef(uri),
      indexedAt: INDEXED_AT,
      subject:
        collection === NSID.document
          ? uri
          : recordUri(paul, NSID.document, String(i)),
    }
  })
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimelineV2#activityActorGroup',
    collection,
    indexedAt: INDEXED_AT,
    actor: actor.did,
    subjects: [subject(view, activities[0].subject)],
    activities,
  } as TimelineEntry
}

/** One activity per actor, newest first; repeat an actor to repeat them. */
export function subjectGroup({
  actors,
  collection,
  view,
}: {
  actors: Profile[]
  collection: string
  view: View
}): TimelineEntry {
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimelineV2#activitySubjectGroup',
    collection,
    indexedAt: INDEXED_AT,
    subject: subject(view),
    activities: actors.map((actor, i) => ({
      ref: strongRef(recordUri(actor, collection, String(i))),
      indexedAt: INDEXED_AT,
      actor: actor.did,
    })),
  } as TimelineEntry
}

/** Related activity on an item: one `collection` record per actor. */
export function related(
  actors: Profile[],
  collection: string = NSID.recommend,
): RelatedActivity[] {
  return actors.map((actor, i) => ({
    ref: strongRef(recordUri(actor, collection, String(i))),
    collection: collection as RelatedActivity['collection'],
    indexedAt: INDEXED_AT,
    actor: actor.did,
  }))
}
