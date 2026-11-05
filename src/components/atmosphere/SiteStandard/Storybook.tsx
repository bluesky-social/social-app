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
  likeCount: 23,
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
        <H2>Document compact with containerStyle</H2>
        <DocumentCompact view={document} containerStyle={[a.px_lg, a.py_md]} />
      </View>

      <View style={[a.gap_md]}>
        <H2>Document</H2>
        <Document view={document} />
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
