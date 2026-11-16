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
import {atoms as a, useTheme} from '#/alf'
import {
  matchStandardSiteHostByPublication,
  matchStandardSiteHostByUrl,
  type StandardSiteHost,
} from '#/components/atmosphere/SiteStandard/publishers'
import {GrainMark} from '#/components/icons/community/Grain'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {place, site, social} from '#/lexicons'
import {type ActivityCardRow} from '../rows'
import {ActivitySentence} from './ActivitySentence'

export function ActivityHeader({row}: {row: ActivityCardRow}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const {actor} = row
  const app = getActivityApp(row)
  const moderation = moderationOpts
    ? moderateProfile(actor, moderationOpts)
    : undefined
  const name = sanitizeDisplayName(
    actor.displayName || sanitizeHandle(actor.handle),
    moderation?.ui('displayName'),
  )

  return (
    <View style={[a.flex_row, a.align_center, a.gap_md]}>
      <PreviewableUserAvatar
        type="user"
        size={42}
        profile={actor}
        moderation={moderation?.ui('avatar')}
      />
      <View style={[a.flex_1]}>
        <Text emoji style={[a.text_sm, a.leading_snug, t.atoms.text]}>
          <ActivitySentence
            row={row}
            actor={
              <InlineLinkText
                to={makeProfileLink(actor)}
                label={name}
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
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {app ? (
                  <Trans comment='Precedes an app icon and name, e.g. "6h ago on [icon] pckt". {timeElapsed} is already translated.'>
                    {timeElapsed} on
                  </Trans>
                ) : (
                  timeElapsed
                )}
              </Text>
              {app ? <AppName app={app} /> : null}
            </View>
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
      // No Streamplace icon exists yet.
      return {name: 'Streamplace'}
    default:
      return undefined
  }
}

function AppName({app}: {app: ActivityApp}) {
  const t = useTheme()
  return (
    <>
      {app.Icon ? (
        <app.Icon size="xs" fill={t.atoms.text_contrast_medium.color} />
      ) : null}
      <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_medium]}>
        {app.name}
      </Text>
    </>
  )
}
