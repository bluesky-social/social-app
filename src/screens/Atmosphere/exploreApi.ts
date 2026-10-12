import {l} from '@atproto/lex'

import {app, com} from '#/lexicons'

/**
 * Temporary runtime contract for `app.bsky.unspecced.getAtmosphereExploreTab`
 * and the `app.bsky.embed.external` view definitions it returns (atproto PR
 * #5617).
 *
 * The endpoint is live on the production appview, but the published lexicons
 * that the managed schemas in `lexicons/` are fetched from do not include these
 * definitions yet, so they cannot be generated. Replace this module with the
 * generated `app.bsky.unspecced.getAtmosphereExploreTab` and
 * `app.bsky.embed.external` definitions once they are published. Until then,
 * responses are still fully validated by the client against this schema.
 */

const NSID = 'app.bsky.embed.external'

const profiles = l.array(app.bsky.actor.defs.profileViewBasic)

/** Fields shared by every external view. */
const viewFields = {
  createdAt: l.optional(l.string({format: 'datetime'})),
  updatedAt: l.optional(l.string({format: 'datetime'})),
  labels: l.optional(l.array(com.atproto.label.defs.label)),
  associatedRefs: l.optional(l.array(com.atproto.repo.strongRef.main)),
  associatedProfiles: l.optional(profiles),
}

export const viewArticlePublicationTheme = l.typedObject(
  NSID,
  'viewArticlePublicationTheme',
  l.object({
    background: l.optional(l.string()),
    foreground: l.optional(l.string()),
    accent: l.optional(l.string()),
    accentForeground: l.optional(l.string()),
  }),
)

export const viewArticlePublication = l.typedObject(
  NSID,
  'viewArticlePublication',
  l.object({
    uri: l.string({format: 'uri'}),
    title: l.string(),
    description: l.string(),
    ...viewFields,
    logo: l.optional(l.string({format: 'uri'})),
    image: l.optional(l.string({format: 'uri'})),
    theme: l.optional(viewArticlePublicationTheme),
    subscriptionCount: l.optional(l.integer({minimum: 0})),
    /** Available profile previews, limited to three. */
    subscribers: l.optional(
      l.array(app.bsky.actor.defs.profileViewBasic, {maxLength: 3}),
    ),
  }),
)

export const viewArticle = l.typedObject(
  NSID,
  'viewArticle',
  l.object({
    uri: l.string({format: 'uri'}),
    title: l.string(),
    description: l.string(),
    ...viewFields,
    image: l.optional(l.string({format: 'uri'})),
    publisher: l.optional(viewArticlePublication),
    readingTime: l.optional(l.integer({minimum: 1})),
    likeCount: l.optional(l.integer({minimum: 0})),
    /** Available profile previews, limited to three. */
    likers: l.optional(
      l.array(app.bsky.actor.defs.profileViewBasic, {maxLength: 3}),
    ),
  }),
)

export const viewGalleryImage = l.typedObject(
  NSID,
  'viewGalleryImage',
  l.object({
    thumbnail: l.string({format: 'uri'}),
    fullsize: l.string({format: 'uri'}),
    alt: l.optional(l.string()),
    aspectRatio: l.optional(app.bsky.embed.defs.aspectRatio),
  }),
)

export const viewGallery = l.typedObject(
  NSID,
  'viewGallery',
  l.object({
    uri: l.string({format: 'uri'}),
    title: l.string(),
    description: l.string(),
    ...viewFields,
    /** Open union: unsupported future item types are preserved, not rejected. */
    items: l.array(l.typedUnion([l.typedRef(() => viewGalleryImage)], false)),
    likeCount: l.optional(l.integer({minimum: 0})),
    /** Available profile previews, limited to three. */
    likers: l.optional(
      l.array(app.bsky.actor.defs.profileViewBasic, {maxLength: 3}),
    ),
  }),
)

export const viewLivestream = l.typedObject(
  NSID,
  'viewLivestream',
  l.object({
    uri: l.string({format: 'uri'}),
    title: l.string(),
    description: l.string(),
    ...viewFields,
    image: l.optional(l.string({format: 'uri'})),
    active: l.boolean(),
    startedAt: l.optional(l.string({format: 'datetime'})),
    endedAt: l.optional(l.string({format: 'datetime'})),
  }),
)

const featured = <T extends l.Validator>(view: T) =>
  l.object({featured: l.boolean(), view})

const announcementBanner = l.object({
  id: l.optional(l.string({maxLength: 4096})),
  title: l.optional(l.string({maxLength: 4096})),
  description: l.optional(l.string({maxLength: 4096})),
  url: l.optional(l.string({format: 'uri', maxLength: 4096})),
  image: l.optional(l.string({format: 'uri', maxLength: 4096})),
  overlayColor: l.optional(l.string({maxLength: 4096})),
  textColor: l.optional(l.string({maxLength: 4096})),
})

const appCard = l.object({
  id: l.optional(l.string({maxLength: 4096})),
  title: l.optional(l.string({maxLength: 4096})),
  description: l.optional(l.string({maxLength: 4096})),
  logo: l.optional(l.string({format: 'uri', maxLength: 4096})),
  backgroundImage: l.optional(l.string({format: 'uri', maxLength: 4096})),
  overlayColor: l.optional(l.string({maxLength: 4096})),
  textColor: l.optional(l.string({maxLength: 4096})),
  url: l.optional(l.string({format: 'uri', maxLength: 4096})),
  category: l.optional(l.string({maxLength: 4096})),
})

const output = l.jsonPayload({
  announcementBanner: l.optional(announcementBanner),
  articles: l.array(featured(viewArticle)),
  publications: l.array(featured(viewArticlePublication)),
  photos: l.array(featured(viewGallery)),
  livestreams: l.array(featured(viewLivestream)),
  apps: l.array(appCard, {maxLength: 100}),
})

/** Response body schema, exported so tests can validate fixture data. */
export const atmosphereDataSchema = output.schema

export const getAtmosphereExploreTab = l.query(
  'app.bsky.unspecced.getAtmosphereExploreTab',
  l.params({
    langs: l.optional(l.array(l.string({format: 'language'}))),
    countryCode: l.optional(l.string()),
    regionCode: l.optional(l.string()),
  }),
  output,
)

/** The `getAtmosphereExploreTab` response body. */
export type AtmosphereData = l.InferMethodOutputBody<
  typeof getAtmosphereExploreTab
>
