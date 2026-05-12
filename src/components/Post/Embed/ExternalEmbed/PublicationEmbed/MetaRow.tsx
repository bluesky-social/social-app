import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Leaf_Stroke2_Corner0_Rounded as Leaf} from '#/components/icons/Leaf'
import {Text} from '#/components/Typography'
import {type PublicationViewExternal} from './types'

export function MetaRow({link}: {link: PublicationViewExternal}) {
  const t = useTheme()
  const {i18n} = useLingui()

  // Guard against malformed dates (REG/EDGE from sweep): only render when
  // `new Date(...)` produces a finite timestamp.
  let formattedDate: string | undefined
  if (link.createdAt) {
    const parsed = new Date(link.createdAt)
    if (!Number.isNaN(parsed.getTime())) {
      formattedDate = i18n.date(parsed, {dateStyle: 'medium'})
    }
  }

  return (
    <View
      style={[
        a.flex_row,
        a.flex_wrap,
        a.align_center,
        a.justify_between,
        a.gap_xs,
      ]}>
      <View style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_md]}>
        {formattedDate && (
          <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_high]}>
            {formattedDate}
          </Text>
        )}
        {/*
          TODO(APP-2160): Enable once the lexicon exposes an aggregate share
          count for the external URL. `associatedBskyPost.repostCount` is the
          wrong semantics (reshares of a single canonical post, not shares of
          the URL). Component exists below for the moment that field lands.
        */}
        {/* <SharesChip count={???} /> */}
        {typeof link.readingTime === 'number' && link.readingTime > 0 && (
          <ReadingTimeChip minutes={link.readingTime} />
        )}
      </View>
      {/*
        TODO(APP-2160): Enable once the lexicon exposes a host/platform name
        on `viewExternalSource` (e.g. "Leaflet"). Component exists below for
        the moment that field lands.
      */}
      {/* <HostedByChip name={???} /> */}
    </View>
  )
}

function ReadingTimeChip({minutes}: {minutes: number}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
      <Clock size="xs" style={[t.atoms.text_contrast_high]} />
      <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_high]}>
        <Trans comment="Reading time in minutes for an external article. # is the number.">
          {plural(minutes, {one: '# min', other: '# min'})}
        </Trans>
      </Text>
    </View>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SharesChip({count}: {count: number}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
      <Text
        style={[
          a.text_xs,
          a.leading_snug,
          a.underline,
          t.atoms.text_contrast_high,
        ]}>
        <Trans comment="Number of times an external URL has been shared on Bluesky. # is the count.">
          {plural(count, {one: '# share', other: '# shares'})}
        </Trans>
      </Text>
    </View>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HostedByChip({name}: {name: string}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
      <Leaf size="xs" style={[t.atoms.text_contrast_high]} />
      <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_high]}>
        <Trans comment="Host platform label on an external article card. e.g. 'Hosted by Leaflet'.">
          Hosted by {name}
        </Trans>
      </Text>
    </View>
  )
}
