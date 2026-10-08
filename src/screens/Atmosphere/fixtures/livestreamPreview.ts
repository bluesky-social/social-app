import {
  type AtmosphereData,
  type AtmosphereLivestreamView,
} from '../exploreData'

const previewAuthorProfile = {
  $type: 'app.bsky.actor.defs#profileViewBasic',
  did: 'did:plc:ifn645rwvsuolxg7o3w7ouo4',
  handle: 'aster.id',
  displayName: 'Aster',
  avatar:
    'https://cdn.bsky.app/img/avatar/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreicid7hoyx5d2if24eryyhb3lg4ioy2mdrmiriga3k2cay6k5io4ta',
} satisfies NonNullable<AtmosphereLivestreamView['associatedProfiles']>[number]

export const livestreamPreviewFixture = [
  {
    featured: true,
    view: {
      $type: 'app.bsky.embed.external#viewLivestream',
      uri: 'https://example.com/livestreams/open-publishing',
      title: 'A look at open publishing',
      description:
        'A live conversation about building independent spaces for writing and research.',
      active: true,
      image:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreidvntdnpe3nzj7wkdxjuhutbf5g7lozznoe7gosqgw3xc2mx3i3om@webp',
      startedAt: '2026-10-07T17:00:00.000Z',
      associatedProfiles: [previewAuthorProfile],
    },
  },
  {
    featured: true,
    view: {
      $type: 'app.bsky.embed.external#viewLivestream',
      uri: 'https://example.com/livestreams/community-q-and-a',
      title: 'Community Q&A',
      description:
        'Questions and answers about the latest community tools and updates.',
      active: false,
      image:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:v46ojbiop5ebs5h7gaomixcc/bafkreiaqvoj5onk5t6v6al2jvqkgydicwfpbbjdawwcfdljvgv7n7peyim@png',
      endedAt: '2026-10-06T18:00:00.000Z',
      associatedProfiles: [previewAuthorProfile],
    },
  },
  {
    featured: true,
    view: {
      $type: 'app.bsky.embed.external#viewLivestream',
      uri: 'https://example.com/livestreams/creative-coding',
      title: 'Creative coding session',
      description:
        'A hands-on stream exploring small generative art projects with the community.',
      active: true,
      image:
        'https://app-cms-production.bsky.workers.dev/images/image-0a7748426cbd27b63c04a608d930120d2beb9727-3000x2000-jpg/large',
      startedAt: '2026-10-07T18:30:00.000Z',
      associatedProfiles: [previewAuthorProfile],
    },
  },
] satisfies AtmosphereData['livestreams']
