import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {
  PublicationCard,
  StandardSiteCompactDocumentCard,
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
import {
  activityCollections,
  isRecommendRecord as isRecommendationRecord,
  isSubscriptionRecord,
} from '../types'
import {ActivityRowBody} from './ActivityHeader'

export function DocumentBody({
  computedItemView,
  item,
}: ActivityPresentationProps) {
  const useLargeCard = getUseLargeCard(item, computedItemView)
  if (!isDocumentRoot(item) && !useLargeCard) {
    return null
  }

  const views = getDocumentUris(item).flatMap(uri => {
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
        {views.map(view =>
          useLargeCard ? (
            <StandardSiteEmbed key={getViewKey(view)} view={view} />
          ) : (
            <StandardSiteCompactDocumentCard
              key={getViewKey(view)}
              view={view}
            />
          ),
        )}
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

function isDocumentRoot(item: ActivityPresentationProps['item']) {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  return collection === activityCollections.document
}

function getUseLargeCard(
  item: ActivityPresentationProps['item'],
  computedItemView: ActivityPresentationProps['computedItemView'],
) {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  if (collection === activityCollections.document) {
    return computedItemView.subscriptionState === 'all'
  }

  return (
    collection === activityCollections.recommendation &&
    item.type === 'group' &&
    item.group.groupBy === 'subject' &&
    item.group.items.length > 1
  )
}

function getDocumentUris(item: ActivityPresentationProps['item']) {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  if (collection === activityCollections.recommendation) {
    if (
      item.type !== 'group' ||
      item.group.groupBy !== 'subject' ||
      item.group.items.length <= 1
    ) {
      return []
    }

    const fallbackTarget = getRecommendationTargetUri(
      item.group.items[0]?.record.uri,
      item,
    )
    return item.group.subject ? [item.group.subject] : [fallbackTarget]
  }

  return getRootActivityUris(item)
}

function getRootActivityUris(item: ActivityPresentationProps['item']) {
  return item.type === 'activity'
    ? [item.activity.record.uri]
    : item.group.items.map(activity => activity.record.uri)
}

function getRecommendationTargetUri(
  rootUri: string | undefined,
  item: ActivityPresentationProps['item'],
) {
  const record = rootUri ? item.associatedRecords[rootUri]?.record : undefined
  return isRecommendationRecord(record) ? record.document : undefined
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
