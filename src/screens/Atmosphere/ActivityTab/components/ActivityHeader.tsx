import {PixelRatio, View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans} from '@lingui/react/macro'

import {formatTimeAgo} from '#/lib/hooks/useTimeAgo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {useAtmosphereMetricContext} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useAlf, useTheme} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {
  type AtmosphereProvider,
  getAtmosphereProvider,
} from '#/components/atmosphere/providers'
import {sizes} from '#/components/icons/common'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {place, site, social} from '#/lexicons'
import {type ActivityCardRow} from '../rows'
import {ActivitySentence} from './ActivitySentence'

const AVATAR_SIZE = 32
const AVATAR_GAP = a.gap_md.gap

/** Lines content under the header up with its text, past the avatar. */
export const ACTIVITY_CONTENT_INDENT = AVATAR_SIZE + AVATAR_GAP

export function ActivityHeader({row}: {row: ActivityCardRow}) {
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const moderationOpts = useModerationOpts()
  const {actor} = row
  const app = getActivityApp(row)
  const appName = app?.name
  const moderation = moderationOpts
    ? moderateProfile(actor, moderationOpts)
    : undefined
  const name = sanitizeDisplayName(
    actor.displayName || sanitizeHandle(actor.handle),
    moderation?.ui('displayName'),
  )
  const logProfilePress = () => {
    if (!metricContext) return
    ax.metric('atmosphere:profile:press', {
      ...metricContext,
      profileDid: actor.did,
      source: 'activityHeader',
    })
  }

  return (
    <View style={[a.flex_row, a.align_center, {gap: AVATAR_GAP}]}>
      <PreviewableUserAvatar
        type="user"
        size={AVATAR_SIZE}
        profile={actor}
        moderation={moderation?.ui('avatar')}
        onBeforePress={logProfilePress}
      />
      <View style={[a.flex_1]}>
        <Text emoji style={[a.text_sm, a.leading_snug, t.atoms.text]}>
          <ActivitySentence
            row={row}
            actor={
              <InlineLinkText
                to={makeProfileLink(actor)}
                label={name}
                onPress={logProfilePress}
                emoji
                disableUnderline
                style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
                {name}
              </InlineLinkText>
            }
          />
        </Text>
        <TimeElapsed timestamp={row.indexedAt} timeToString={formatTimeAgo}>
          {({timeElapsed}) => (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {app ? (
                <Trans comment='When and on which app the activity happened, e.g. "6h ago on pckt". {timeElapsed} is already translated. The app name includes its icon. You can reorder the time and app name, e.g. "<0>{appName}</0>で{timeElapsed}".'>
                  {timeElapsed} on <AppName app={app}>{appName}</AppName>
                </Trans>
              ) : (
                timeElapsed
              )}
            </Text>
          )}
        </TimeElapsed>
      </View>
    </View>
  )
}

/**
 * The app an activity happened on, as attributed by the appview. Only records
 * that are published on an app name one. Graph records (recommends,
 * subscriptions) can be written from any app, so they never name one,
 * regardless of what they point at.
 */
function getActivityApp({
  collection,
  content,
}: ActivityCardRow): AtmosphereProvider | undefined {
  switch (collection) {
    case site.standard.document.$type:
      // For actor groups this is the newest article.
      if (content.type !== 'article') return undefined
      break
    case social.grain.gallery.$type:
      if (content.type !== 'gallery') return undefined
      break
    case place.stream.livestream.$type:
      if (content.type !== 'livestream') return undefined
      break
    default:
      return undefined
  }
  return getAtmosphereProvider(content.view.providerId)
}

/** Centers the app marks on text_sm's cap height rather than its baseline. */
const INLINE_ICON_OFFSET = 1.5

export function AppName({
  app,
  color,
  size = 'sm',
  children,
}: {
  app: AtmosphereProvider
  /** Defaults to the surrounding metadata's text color. */
  color?: string
  /**
   * Must match the surrounding text, since `Text` applies its own default
   * size rather than inheriting.
   */
  size?: 'xs' | 'sm'
  children: React.ReactNode
}) {
  const t = useTheme()
  const textColor = color ?? t.atoms.text_contrast_medium.color
  const {fonts} = useAlf()
  const nativeFontScale = useNativeFontScale()
  const textSize = size === 'xs' ? a.text_xs : a.text_sm
  /** The icon and its offset are tuned for text_sm. */
  const sizeRatio = textSize.fontSize / a.text_sm.fontSize
  const scaleMultiplier = fonts.scaleMultiplier * nativeFontScale * sizeRatio
  /** Inline views do not inherit the surrounding text's font scaling. */
  const iconSize = PixelRatio.roundToNearestPixel(sizes.xs * scaleMultiplier)

  return (
    <Text style={[textSize, a.font_semi_bold, {color: textColor}]}>
      <app.Icon
        width={iconSize}
        fill={textColor}
        style={{
          transform: [{translateY: INLINE_ICON_OFFSET * scaleMultiplier}],
        }}
      />
      {/* Keep the icon and name on the same line. */}
      {'\u00a0'}
      {children}
    </Text>
  )
}
