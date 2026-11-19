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
  matchStandardSiteHostByPublication,
  matchStandardSiteHostByUrl,
  type StandardSiteHost,
} from '#/components/atmosphere/SiteStandard/publishers'
import {sizes} from '#/components/icons/common'
import {GrainMark} from '#/components/icons/community/Grain'
import {Streamplace} from '#/components/icons/community/Streamplace'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {place, site, social} from '#/lexicons'
import {type ActivityCardRow} from '../rows'
import {ActivitySentence} from './ActivitySentence'

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
    <View style={[a.flex_row, a.align_center, a.gap_md]}>
      <PreviewableUserAvatar
        type="user"
        size={42}
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

type ActivityApp = {name: string; Icon?: StandardSiteHost['Icon']}

/**
 * The app an activity happened on, inferred only from the activity's own
 * collection. Graph records (recommends, subscriptions) can be written from
 * any app, so they never name one, regardless of what they point at.
 */
function getActivityApp({
  collection,
  content,
}: ActivityCardRow): ActivityApp | undefined {
  switch (collection) {
    case site.standard.document.$type:
      // Publishing happens on the article's publisher. For actor groups this
      // is the newest article.
      if (content.type !== 'article') return undefined
      return (
        (content.view.publisher
          ? matchStandardSiteHostByPublication(content.view.publisher)
          : matchStandardSiteHostByUrl(content.view.uri)) ?? undefined
      )
    case social.grain.gallery.$type:
      return {name: 'Grain', Icon: GrainMark}
    case place.stream.livestream.$type:
      return {name: 'Streamplace', Icon: Streamplace}
    default:
      return undefined
  }
}

/** Centers the app marks on text_sm's cap height rather than its baseline. */
const INLINE_ICON_OFFSET = 1.5

function AppName({
  app,
  children,
}: {
  app: ActivityApp
  children: React.ReactNode
}) {
  const t = useTheme()
  const {fonts} = useAlf()
  const nativeFontScale = useNativeFontScale()
  const scaleMultiplier = fonts.scaleMultiplier * nativeFontScale
  /** Inline views do not inherit the surrounding text's font scaling. */
  const iconSize = PixelRatio.roundToNearestPixel(sizes.xs * scaleMultiplier)

  return (
    <Text style={[a.font_semi_bold, t.atoms.text_contrast_medium]}>
      {app.Icon ? (
        <>
          <app.Icon
            width={iconSize}
            fill={t.atoms.text_contrast_medium.color}
            style={{
              transform: [{translateY: INLINE_ICON_OFFSET * scaleMultiplier}],
            }}
          />
          {/* Keep the icon and name on the same line. */}
          {'\u00a0'}
        </>
      ) : null}
      {children}
    </Text>
  )
}
