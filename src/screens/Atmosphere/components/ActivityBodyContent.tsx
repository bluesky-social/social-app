import {useTheme} from '#/alf'
import {PublicationCard} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {
  createPublicationExternalView,
  getPublicationBodyThemeColors,
} from '../externalViews'
import {type ActivityPresentationProps} from '../presentation'
import {activityCollections, isSubscriptionRecord} from '../types'
import {ActivityRowBody} from './ActivityHeader'

export function ActivityPublicationCardBody({item}: ActivityPresentationProps) {
  const t = useTheme()

  for (const uri of getPublicationBodyCandidateUris(item)) {
    const view = createPublicationExternalView({
      uri,
      associatedRecords: item.associatedRecords,
      actors: item.actors,
    })
    if (!view) continue

    const themeColors: ssTypes.ThemeColors = getPublicationBodyThemeColors(
      view,
    ) ?? {
      custom: false,
      accent: t.atoms.text?.color ?? '#000000',
      accentForeground: t.atoms.text_inverted?.color ?? '#ffffff',
    }

    return (
      <ActivityRowBody>
        <PublicationCard view={view} themeColors={themeColors} />
      </ActivityRowBody>
    )
  }

  return null
}

function getRootActivities(item: ActivityPresentationProps['item']) {
  return item.type === 'activity' ? [item.activity] : item.group.items
}

function getRootActivityUris(item: ActivityPresentationProps['item']) {
  return getRootActivities(item).map(activity => activity.record.uri)
}

function getPublicationBodyCandidateUris(
  item: ActivityPresentationProps['item'],
) {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  const rootUris = getRootActivityUris(item)
  if (collection !== activityCollections.subscription) {
    return rootUris
  }

  return rootUris.map(uri => getSubscriptionPublicationUri(uri, item))
}

function getSubscriptionPublicationUri(
  rootUri: string,
  item: ActivityPresentationProps['item'],
) {
  const record = item.associatedRecords[rootUri]?.record
  return isSubscriptionRecord(record) ? record.publication : undefined
}
