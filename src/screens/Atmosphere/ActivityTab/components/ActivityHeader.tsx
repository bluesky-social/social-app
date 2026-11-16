import {View} from 'react-native'
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
import {atoms as a, useTheme} from '#/alf'
import {
  matchStandardSiteHostByPublication,
  matchStandardSiteHostByUrl,
  type StandardSiteHost,
} from '#/components/atmosphere/SiteStandard/publishers'
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
          {({timeElapsed}) =>
            app ? (
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                {/*
                 * The time, icon and app name are separate tags so translators
                 * can reorder them. Wrapping the Trans in one Text would put
                 * the icon inline, which needs baseline nudging, so the
                 * comment asks translators to keep all text inside the tags.
                 */}
                {/* oxlint-disable-next-line bsky-internal/avoid-unwrapped-text */}
                <Trans comment='When and on which app the activity happened, e.g. "6h ago on [icon] pckt". {timeElapsed} is already translated, e.g. "6h ago". <1/> is the app icon and <2>{appName}</2> is its name. You can reorder the tags. CAREFUL: any text outside <0> or <2> will not display correctly, so put every word (including particles such as で or 에서) inside one of them, e.g. "<1/><2>{appName}</2><0>で{timeElapsed}</0>".'>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {timeElapsed} on
                  </Text>
                  <AppIcon app={app} />
                  <Text
                    style={[
                      a.text_sm,
                      a.font_semi_bold,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {appName}
                  </Text>
                </Trans>
              </View>
            ) : (
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {timeElapsed}
              </Text>
            )
          }
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

function AppIcon({app}: {app: ActivityApp}) {
  const t = useTheme()
  return app.Icon ? (
    <app.Icon size="xs" fill={t.atoms.text_contrast_medium.color} />
  ) : null
}
