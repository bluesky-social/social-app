import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {getAssociatedProfile} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {place} from '#/lexicons'
import {type ActivityContent} from '../rows'
import {CardStats} from './CardStats'

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.6)'

/** A Streamplace livestream: title, description, stats, and its thumbnail. */
export function LivestreamCard({
  content: {view},
}: {
  content: Extract<ActivityContent, {type: 'livestream'}>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {state: interacted, onIn, onOut} = useInteractionState()
  const duration = getStreamDuration(view.startedAt, view.endedAt)

  return (
    <View style={a.relative}>
      <Link
        testID="activityV1LivestreamCard"
        to={view.uri}
        label={l`Open livestream: ${view.title}`}
        onHoverIn={onIn}
        onHoverOut={onOut}
        onFocus={onIn}
        onBlur={onOut}
        style={[
          a.flex_col,
          a.align_stretch,
          a.w_full,
          a.gap_sm,
          a.p_md,
          a.rounded_lg,
          a.border,
          t.atoms.bg,
          interacted
            ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_high]
            : t.atoms.border_contrast_low,
        ]}>
        <View style={[a.gap_xs, a.pr_5xl]}>
          <Text
            emoji
            numberOfLines={2}
            style={[a.text_lg, a.font_bold, a.leading_snug]}>
            {view.title}
          </Text>
          {!!view.description && (
            <Text emoji numberOfLines={3} style={[a.text_sm, a.leading_snug]}>
              {view.description}
            </Text>
          )}
        </View>
        <CardStats date={view.startedAt ?? view.createdAt} />
        <View
          style={[
            a.w_full,
            a.overflow_hidden,
            a.rounded_md,
            t.atoms.bg_contrast_25,
            {aspectRatio: 16 / 9},
          ]}>
          {!!view.image && (
            <Image
              source={{uri: view.image}}
              contentFit="cover"
              accessible={false}
              style={[a.absolute, a.inset_0]}
            />
          )}
          <View
            pointerEvents="none"
            style={[a.absolute, a.inset_0, a.align_center, a.justify_center]}>
            <View
              style={[
                a.rounded_full,
                a.p_lg,
                {backgroundColor: OVERLAY_COLOR},
              ]}>
              <PlayIcon size="xl" fill="white" />
            </View>
          </View>
          {duration ? (
            <View
              pointerEvents="none"
              style={[
                a.absolute,
                a.px_sm,
                a.py_xs,
                a.rounded_full,
                {bottom: 8, right: 8, backgroundColor: OVERLAY_COLOR},
              ]}>
              <Text style={[a.text_xs, a.font_medium, {color: 'white'}]}>
                {duration}
              </Text>
            </View>
          ) : null}
        </View>
      </Link>
      <AtmosphereCardMenu
        type="livestream"
        item={view}
        reportableTypes={[place.stream.livestream.$type]}
        author={getAssociatedProfile(view.associatedProfiles)}
        offsetY={a.p_md.padding}
        offsetX={a.p_md.padding}
      />
    </View>
  )
}

/** "3:50:23" for an ended stream; undefined while live or if unknown. */
export function getStreamDuration(
  startedAt: string | undefined,
  endedAt: string | undefined,
): string | undefined {
  if (!startedAt || !endedAt) return undefined
  const seconds = Math.floor(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  )
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
