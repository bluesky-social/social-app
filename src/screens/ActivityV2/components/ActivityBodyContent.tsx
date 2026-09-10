import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {
  PublicationCard,
  StandardSiteEmbed,
} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {type app} from '#/lexicons'
import {
  createDocumentExternalView,
  createPublicationExternalView,
  getPublicationBodyThemeColors,
} from '../externalViews'
import {type ActivityPresentationProps} from '../presentation'
import {activityCollections, isSubscriptionRecord} from '../types'
import {ActivityRowBody} from './ActivityHeader'

export function ActivityArticleEmbedsBody({
  computedItemView,
  item,
}: ActivityPresentationProps) {
  if (computedItemView.subscriptionState !== 'all') {
    return null
  }

  const views = getRootActivityUris(item).flatMap(uri => {
    const view = createDocumentExternalView({
      uri,
      associatedRecords: item.associatedRecords,
      actors: item.actors,
    })
    return view ? [view] : []
  })
  if (views.length === 0) {
    return null
  }

  return (
    <ActivityRowBody>
      <View style={[a.gap_sm]}>
        {views.map(view => (
          <StandardSiteEmbed key={getViewKey(view)} view={view} />
        ))}
      </View>
    </ActivityRowBody>
  )
}

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

function getRootActivityUris(item: ActivityPresentationProps['item']) {
  return item.type === 'activity'
    ? [item.activity.record.uri]
    : item.group.items.map(activity => activity.record.uri)
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

function getViewKey(view: app.bsky.embed.external.ViewExternal) {
  return view.associatedRefs?.[0]?.uri ?? view.uri
}
