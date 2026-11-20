import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Document} from '#/components/atmosphere/SiteStandard/Document'
import {
  DocumentCompact,
  DocumentCompactCard,
} from '#/components/atmosphere/SiteStandard/DocumentCompact'
import {
  Publication,
  PublicationCard,
} from '#/components/atmosphere/SiteStandard/Publication'
import {H1, H2} from '#/components/Typography'
import {type app, site} from '#/lexicons'

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGklEQVR42mOQ9bsBRLpX9gMRAwoHQkGEUDgAaFoYGUn9uwMAAAAASUVORK5CYII='

const author = {
  did: 'did:plc:abcdefghijklmnopqrstuvwx',
  handle: 'riley.example.com',
  displayName: 'Riley Rivers',
} satisfies app.bsky.actor.defs.ProfileViewBasic

const likers = [
  {
    did: 'did:plc:liker1liker1liker1liker1l',
    handle: 'danielle.example.com',
    displayName: 'danielle yuhan',
    avatar: IMAGE,
  },
  {
    did: 'did:plc:liker2liker2liker2liker2l',
    handle: 'sam.example.com',
    displayName: 'Sam Okafor',
    avatar: IMAGE,
  },
  {
    did: 'did:plc:liker3liker3liker3liker3l',
    handle: 'jo.example.com',
    avatar: IMAGE,
  },
] satisfies app.bsky.actor.defs.ProfileViewBasic[]

const publication = {
  uri: 'https://example.com/field-notes',
  title: 'Field Notes',
  description: 'Small observations about nature, design, and everyday life.',
  logo: IMAGE,
  associatedRefs: [
    {
      uri: `at://${author.did}/${site.standard.publication.$type}/storybook`,
      cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
    },
  ],
  associatedProfiles: [author],
} satisfies app.bsky.embed.external.ViewArticlePublication

const document = {
  uri: 'https://example.com/field-notes/looking-closely',
  title: 'The art of looking closely',
  description:
    'A walk around the neighborhood reveals a whole world hiding in plain sight.',
  image: IMAGE,
  createdAt: '2026-01-15T12:00:00.000Z',
  readingTime: 5,
  viewer: {},
  likeCount: 27,
  likers,
  publisher: publication,
  associatedRefs: [
    {
      uri: `at://${author.did}/${site.standard.document.$type}/storybook`,
      cid: 'bafyreig3yg2msah74sgvow25uxddqbabex3f3mh6hysess3w5kmgiv6zqy',
    },
    ...publication.associatedRefs,
  ],
  associatedProfiles: [author],
} satisfies app.bsky.embed.external.ViewArticle

const singleLikerDocument = {
  ...document,
  likeCount: 1,
  likers: likers.slice(0, 1),
} satisfies app.bsky.embed.external.ViewArticle

/* Like Discover and Following, which don't hydrate liker previews. */
const noLikerPreviewsDocument = {
  ...document,
  likers: undefined,
} satisfies app.bsky.embed.external.ViewArticle

const noLikersDocument = {
  ...document,
  likeCount: 0,
  likers: [],
} satisfies app.bsky.embed.external.ViewArticle

const leafletPublication = {
  ...publication,
  uri: 'https://fieldnotes.leaflet.pub',
  providerId: 'leaflet.pub',
  theme: {accent: '#4a7318', accentForeground: '#ffffff'},
} satisfies app.bsky.embed.external.ViewArticlePublication

const leafletDocument = {
  ...document,
  uri: 'https://fieldnotes.leaflet.pub/looking-closely',
  providerId: 'leaflet.pub',
  publisher: leafletPublication,
} satisfies app.bsky.embed.external.ViewArticle

export function SiteStandardStorybook() {
  return (
    <View testID="siteStandardStorybook" style={[a.gap_lg]}>
      <H1>SiteStandard v2</H1>

      <View style={[a.gap_md]}>
        <H2>Document compact</H2>
        <DocumentCompact view={document} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card</H2>
        <DocumentCompactCard view={document} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card, themed Leaflet publication</H2>
        <DocumentCompactCard view={leafletDocument} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card, recommenders you follow</H2>
        <DocumentCompactCard
          view={document}
          recommenders={{actors: likers, actorCount: likers.length}}
        />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card, only recommender is someone you follow</H2>
        <DocumentCompactCard
          view={singleLikerDocument}
          recommenders={{actors: likers.slice(0, 1), actorCount: 1}}
        />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card, single recommender</H2>
        <DocumentCompactCard view={singleLikerDocument} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card, no recommender previews</H2>
        <DocumentCompactCard view={noLikerPreviewsDocument} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact card, no recommenders</H2>
        <DocumentCompactCard view={noLikersDocument} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document compact with containerStyle</H2>
        <DocumentCompact view={document} containerStyle={[a.px_lg, a.py_md]} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document</H2>
        <Document view={document} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document, themed Leaflet publication</H2>
        <Document view={leafletDocument} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Publication</H2>
        <Publication view={publication} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Publication card</H2>
        <PublicationCard view={publication} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Publication with containerStyle</H2>
        <Publication view={publication} containerStyle={[a.px_lg, a.py_md]} />
      </View>
    </View>
  )
}
