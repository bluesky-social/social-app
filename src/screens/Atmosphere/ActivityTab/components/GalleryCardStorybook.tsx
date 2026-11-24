import {View} from 'react-native'
import {Asset} from 'expo-asset'

import {atoms as a} from '#/alf'
import {H1, H2, Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {type app} from '#/lexicons'
import {GalleryCard} from './GalleryCard'

/*
 * The card validates photo URLs, which must be absolute. Web serves assets
 * from a relative path.
 */
function asUri(value: string) {
  const uri =
    IS_WEB && value.startsWith('/') ? window.location.origin + value : value
  return uri as `${string}:${string}`
}

const kawaii = asUri(
  Asset.fromModule(require('../../../../../assets/kawaii.png')).uri,
)
const welcome = asUri(
  Asset.fromModule(require('../../../../../assets/images/welcome-modal-bg.jpg'))
    .uri,
)

/*
 * Aspect ratios are what the card sizes photos by. The images are cropped to
 * fit, so a few assets can stand in for portrait, square and wide photos.
 */
function photo(
  uri: `${string}:${string}`,
  width: number,
  height: number,
  alt?: string,
) {
  return {
    $type: 'app.bsky.embed.external#viewGalleryImage' as const,
    thumbnail: uri,
    fullsize: uri,
    alt,
    aspectRatio: {width, height},
  }
}

const author = {
  did: 'did:plc:abcdefghijklmnopqrstuvwx',
  handle: 'riley.example.com',
  displayName: 'Riley Rivers',
} satisfies app.bsky.actor.defs.ProfileViewBasic

const knownLikers = [
  {
    did: 'did:plc:liker1liker1liker1liker1l',
    handle: 'danielle.example.com',
    displayName: 'danielle yuhan',
    avatar: welcome,
  },
  {
    did: 'did:plc:liker2liker2liker2liker2l',
    handle: 'sam.example.com',
    displayName: 'Sam Okafor',
    avatar: kawaii,
  },
] satisfies app.bsky.actor.defs.ProfileViewBasic[]

/*
 * No `associatedRefs`, so the card has no record to favorite: tapping the
 * heart can't write to the signed-in account. The heart and count render
 * read-only here, styled the same as the button.
 */
const base = {
  uri: 'https://grain.social/profile/riley.example.com/gallery/storybook',
  providerId: 'grain.social',
  title: 'Weekend wander',
  description:
    'Golden hour in the field, a coffee stop in Richmond, and a first look at next year’s venue.',
  createdAt: `${new Date().getFullYear()}-11-21T12:00:00.000Z`,
  likeCount: 7,
  associatedProfiles: [author],
  viewer: {knownLikers},
  items: [
    photo(welcome, 3, 4, 'A long shadow across a grassy field'),
    photo(kawaii, 4, 5),
    photo(welcome, 16, 9),
    photo(kawaii, 1, 1),
  ],
} satisfies app.bsky.embed.external.ViewGallery

const examples: [string, app.bsky.embed.external.ViewGallery][] = [
  ['4 photos, mixed aspect ratios', base],
  [
    '1 photo, last year',
    {
      ...base,
      items: [photo(welcome, 3, 2)],
      createdAt: `${new Date().getFullYear() - 1}-06-02T12:00:00.000Z`,
    },
  ],
  [
    'Many photos',
    {
      ...base,
      items: Array.from({length: 10}, (_, i) =>
        photo(
          i % 2 ? kawaii : welcome,
          [3, 4, 16, 1][i % 4],
          [4, 5, 9, 1][i % 4],
        ),
      ),
    },
  ],
  [
    '2 portrait photos that fit (stretched to fill)',
    {...base, items: [photo(welcome, 2, 3), photo(kawaii, 2, 3)]},
  ],
  ['No description', {...base, description: ''}],
  ['No favorites', {...base, likeCount: 0, viewer: {}}],
  ['Favorites, none from people you follow', {...base, viewer: {}}],
  [
    'Favorited by you',
    {
      ...base,
      likeCount: 8,
      viewer: {
        knownLikers,
        like: `at://${author.did}/social.grain.favorite/storybook`,
      },
    },
  ],
  [
    'Long title and description',
    {
      ...base,
      title:
        'A very long gallery title that keeps going to check how it wraps across lines',
      description: base.description.repeat(4),
    },
  ],
]

/** Activity tab gallery cards with mocked views, for manual QA. */
export function GalleryCardStorybook() {
  return (
    <View testID="galleryCardStorybook" style={[a.gap_lg]}>
      <H1>Photo cards</H1>
      <Text>
        Mocked views have no associatedRefs, so Favorite is read-only and never
        writes a record.
      </Text>
      {examples.map(([title, view]) => (
        <View key={title} style={[a.gap_md]}>
          <H2>{title}</H2>
          <GalleryCard content={{type: 'gallery', view}} />
        </View>
      ))}
    </View>
  )
}
