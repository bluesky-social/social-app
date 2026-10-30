import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Embed} from '#/components/Post/Embed'
import {
  LINKS,
  MEDIA,
  QUOTE_PLACEHOLDERS,
  QUOTES,
  RECORD_WITH_MEDIA,
} from '#/components/Post/Embed/__fixtures__'
import {CompactMedia} from '#/components/Post/Embed/CompactMedia'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import {H1, H3, Text} from '#/components/Typography'

/**
 * Compact quotes and links, the compact media squares they share with
 * Notifications v2, and full quotes to compare them against.
 */
export function Embeds() {
  return (
    <View style={[a.gap_xl]}>
      <H1>Embeds</H1>

      <Section
        title="Compact quotes"
        description="Images, video and GIFs become a square beside the text, links a compact card. Media without text shows in full. Media behind a warning moves under the text, behind the usual warning.">
        {QUOTES.map(({title, embed}) => (
          <Case key={title} title={title}>
            <Embed embed={embed} quotePresentation="compact" />
          </Case>
        ))}
      </Section>

      <Section
        title="Muted compact quotes"
        description="Notifications v2 mutes a quote's text where it previews the viewer's post, e.g. a like of a quote-only post.">
        {QUOTES.filter(({title}) =>
          ['Text only', 'Text and one image', 'Link'].includes(title),
        ).map(({title, embed}) => (
          <Case key={title} title={title}>
            <Embed embed={embed} quotePresentation="compact" isQuoteTextMuted />
          </Case>
        ))}
      </Section>

      <Section title="Quote placeholders">
        {QUOTE_PLACEHOLDERS.map(({title, embed}) => (
          <Case key={title} title={title}>
            <Embed embed={embed} quotePresentation="compact" />
          </Case>
        ))}
      </Section>

      <Section
        title="Record with media"
        description="A post's own media with a quote. The quote is compact unless told otherwise.">
        <Case title="Compact, by default">
          <Embed embed={RECORD_WITH_MEDIA} />
        </Case>
        <Case title='quotePresentation="default"'>
          <Embed embed={RECORD_WITH_MEDIA} quotePresentation="default" />
        </Case>
      </Section>

      <Section title="Full quotes, for comparison">
        {QUOTES.filter(({title}) =>
          [
            'Text and one image',
            'Text and four images',
            'Link',
            'Media warning (graphic media, self-labelled)',
          ].includes(title),
        ).map(({title, embed}) => (
          <Case key={title} title={title}>
            <Embed embed={embed} />
          </Case>
        ))}
      </Section>

      <Section title="Compact links">
        {LINKS.map(({title, link}) => (
          <Case key={title} title={title}>
            <ExternalEmbed link={link} presentation="compact" />
          </Case>
        ))}
      </Section>

      <Section
        title="Compact media"
        description="The square a compact quote shows at 100, which Notifications v2 also uses at 80 in place of a post's text and at 60 trailing a row.">
        {(
          [
            ['One image', MEDIA.oneImage],
            ['Two images', MEDIA.twoImages],
            ['Three images', MEDIA.threeImages],
            ['Four images', MEDIA.fourImages],
            ['Video', MEDIA.video],
            ['Video without a thumbnail', MEDIA.videoWithoutThumbnail],
            ['GIF (video)', MEDIA.videoGif],
            ['GIF (Tenor link)', MEDIA.tenorGif],
          ] as const
        ).map(([title, embed]) => (
          <Case key={title} title={title}>
            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <CompactMedia embed={embed} size={100} />
              <CompactMedia embed={embed} size={80} />
              <CompactMedia embed={embed} size={60} />
              <CompactMedia embed={embed} size={60} blurred />
            </View>
          </Case>
        ))}
      </Section>
    </View>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <H3>{title}</H3>
      {description && (
        <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
          {description}
        </Text>
      )}
      {children}
    </View>
  )
}

/**
 * One example, about as wide as a post's content in a feed.
 */
function Case({title, children}: {title: string; children: React.ReactNode}) {
  const t = useTheme()
  return (
    <View style={[a.gap_xs, {maxWidth: 520}]}>
      <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_high]}>
        {title}
      </Text>
      {children}
    </View>
  )
}
