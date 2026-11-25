import {type app} from '#/lexicons'

/** The fewest streams the Live now carousel shows in development. */
export const MIN_LIVE_STREAMS_IN_DEV = 3

const author: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:ifn645rwvsuolxg7o3w7ouo4',
  handle: 'aster.id',
  displayName: 'Aster',
  avatar:
    'https://cdn.bsky.app/img/avatar/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreicid7hoyx5d2if24eryyhb3lg4ioy2mdrmiriga3k2cay6k5io4ta',
}

/**
 * Fake live streams that pad out the Live now carousel during development, so
 * its layout can be seen when few streams are live. Never used in production
 * builds.
 */
export const PLACEHOLDER_LIVE_STREAMS: app.bsky.embed.external.ViewLivestream[] =
  [
    {
      $type: 'app.bsky.embed.external#viewLivestream',
      uri: 'https://example.com/livestreams/placeholder-open-publishing',
      title: 'A look at open publishing',
      description: 'Placeholder stream for development.',
      active: true,
      image:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreidvntdnpe3nzj7wkdxjuhutbf5g7lozznoe7gosqgw3xc2mx3i3om@webp',
      associatedProfiles: [author],
    },
    {
      $type: 'app.bsky.embed.external#viewLivestream',
      uri: 'https://example.com/livestreams/placeholder-creative-coding',
      title: 'Creative coding session',
      description: 'Placeholder stream for development.',
      active: true,
      image:
        'https://app-cms-production.bsky.workers.dev/images/image-0a7748426cbd27b63c04a608d930120d2beb9727-3000x2000-jpg/large',
      associatedProfiles: [author],
    },
    {
      $type: 'app.bsky.embed.external#viewLivestream',
      uri: 'https://example.com/livestreams/placeholder-community-q-and-a',
      title: 'Community Q&A',
      description: 'Placeholder stream for development.',
      active: true,
      image:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:v46ojbiop5ebs5h7gaomixcc/bafkreiaqvoj5onk5t6v6al2jvqkgydicwfpbbjdawwcfdljvgv7n7peyim@png',
      associatedProfiles: [author],
    },
  ]
