import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {type ActivityPresentationItem} from '../presentation'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
} from '../types'

const RELATED_ACTIVITY_AVATAR_SIZE = 16
const MAX_RELATED_ACTIVITY_AVATARS = 5

export function ActivityRelatedActivity({
  item,
}: {
  item: ActivityPresentationItem
}) {
  const rows = getDocumentActivities(item).flatMap(activity => {
    const actors = resolveRelatedActors(activity, item)
    return actors.length > 0 ? [{activity, actors}] : []
  })

  if (rows.length === 0) return null

  return (
    <View style={[a.px_xl, a.gap_xs]}>
      {rows.map(({activity, actors}) => (
        <RelatedActivityRow key={activity.record.uri} actors={actors} />
      ))}
    </View>
  )
}

function RelatedActivityRow({actors}: {actors: ActivityActor[]}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const primaryActor = actors[0]
  if (!primaryActor) return null

  const primaryLabel = sanitizeHandle(primaryActor.handle, '@')
  const othersCount = actors.length - 1
  const othersLabel =
    othersCount > 0
      ? l`and ${plural(othersCount, {
          one: '# other',
          other: '# others',
        })}`
      : undefined
  const action = l`recommended`
  const accessibilityLabel = [primaryLabel, othersLabel, action]
    .filter(Boolean)
    .join(' ')

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      <AvatarStack
        profiles={
          actors.slice(
            0,
            MAX_RELATED_ACTIVITY_AVATARS,
          ) as bsky.profile.AnyProfileView[]
        }
        size={RELATED_ACTIVITY_AVATAR_SIZE}
      />
      <Text
        accessibilityHint=""
        accessibilityLabel={accessibilityLabel}
        numberOfLines={2}
        emoji
        style={[a.flex_1, a.text_xs, a.leading_snug, t.atoms.text]}>
        <InlineLinkText
          label={l`View ${primaryLabel}’s profile`}
          to={makeProfileLink({
            did: primaryActor.did,
            handle: primaryActor.handle,
          })}
          style={[a.text_xs, a.leading_snug, a.font_semi_bold, t.atoms.text]}
          emoji>
          {primaryLabel}
        </InlineLinkText>
        {othersLabel ? ` ${othersLabel}` : ''} {action}
      </Text>
    </View>
  )
}

function getDocumentActivities(item: ActivityPresentationItem): ActivityItem[] {
  const activities =
    item.type === 'activity' ? [item.activity] : item.group.items
  const visibleActivities =
    item.type === 'group' && item.group.groupBy === 'actor'
      ? activities.slice(0, 1)
      : activities
  return visibleActivities.filter(
    activity =>
      activity.collection === activityCollections.document &&
      activity.relatedActivity?.length,
  )
}

function resolveRelatedActors(
  activity: ActivityItem,
  item: ActivityPresentationItem,
): ActivityActor[] {
  const seen = new Set<string>()
  return (activity.relatedActivity ?? []).flatMap(related => {
    let did: string
    try {
      did = new AtUri(related.record.uri).host
    } catch {
      return []
    }
    if (seen.has(did)) return []
    seen.add(did)

    const actor = item.actors[did]
    return actor?.did && actor.handle && !isInvalidHandle(actor.handle)
      ? [actor]
      : []
  })
}
