import {View} from 'react-native'
import {Image} from 'expo-image'
import {AtUri} from '@atproto/syntax'

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
  getBlobUrl,
  getPublicationBodyThemeColors,
} from '../externalViews'
import {type ActivityPresentationProps} from '../presentation'
import {
  activityCollections,
  isGrainPhotoRecord,
  isRecommendRecord as isRecommendationRecord,
  isSubscriptionRecord,
} from '../types'
import {ActivityRowBody} from './ActivityHeader'

export function DocumentBody({
  computedItemView,
  item,
}: ActivityPresentationProps) {
  const useLargeCard = getUseLargeCard(item, computedItemView)
  const useCompactRecommendationCard = isFollowedRecommendationTarget(item)
  if (!isDocumentRoot(item) && !useLargeCard && !useCompactRecommendationCard) {
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

export function GrainPhotoBody({item}: ActivityPresentationProps) {
  const photos = getRootActivityUris(item).flatMap(uri => {
    const did = getAuthorityDid(uri)
    const record = item.associatedRecords[uri]?.record
    if (!did || !isGrainPhotoRecord(record)) return []

    const source = getBlobUrl(did, record.photo)
    if (!source) return []

    const alt = record.alt?.trim() || undefined
    const aspectRatio = getAspectRatio(record.aspectRatio)
    return [{uri, source, alt, aspectRatio}]
  })

  if (photos.length === 0) return null

  return (
    <ActivityRowBody>
      <View style={a.gap_sm}>
        {photos.map(photo => (
          <Image
            key={photo.uri}
            testID="activityV2GrainPhotoImage"
            source={{uri: photo.source}}
            style={[a.w_full, a.rounded_lg, {aspectRatio: photo.aspectRatio}]}
            contentFit="cover"
            accessible={Boolean(photo.alt)}
            accessibilityHint=""
            accessibilityLabel={photo.alt}
            accessibilityIgnoresInvertColors
            loading="lazy"
            useAppleWebpCodec
          />
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
    return [getRecommendationDocumentUri(item)]
  }

  const rootUris = getRootActivityUris(item)
  return item.type === 'group' && item.group.groupBy === 'actor'
    ? rootUris.slice(0, 1)
    : rootUris
}

function getRootActivityUris(item: ActivityPresentationProps['item']) {
  return item.type === 'activity'
    ? [item.activity.record.uri]
    : item.group.items.map(activity => activity.record.uri)
}

function isFollowedRecommendationTarget(
  item: ActivityPresentationProps['item'],
) {
  const documentUri = getRecommendationDocumentUri(item)
  const did = getAuthorityDid(documentUri)
  return Boolean(did && item.actors[did]?.viewer?.following)
}

function getRecommendationDocumentUri(item: ActivityPresentationProps['item']) {
  if (item.type === 'activity') {
    return getRecommendationTargetUri(item.activity.record.uri, item)
  }
  if (item.group.groupBy !== 'subject') {
    return undefined
  }

  return (
    item.group.subject ??
    getRecommendationTargetUri(item.group.items[0]?.record.uri, item)
  )
}

function getRecommendationTargetUri(
  rootUri: string | undefined,
  item: ActivityPresentationProps['item'],
) {
  const record = rootUri ? item.associatedRecords[rootUri]?.record : undefined
  return isRecommendationRecord(record) ? record.document : undefined
}

function getAuthorityDid(uri: string | undefined): string | undefined {
  if (!uri) return undefined

  try {
    return new AtUri(uri).host
  } catch {
    return undefined
  }
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

function getAspectRatio(
  aspectRatio: {width: number; height: number} | undefined,
) {
  return aspectRatio &&
    Number.isFinite(aspectRatio.width) &&
    Number.isFinite(aspectRatio.height) &&
    aspectRatio.width > 0 &&
    aspectRatio.height > 0
    ? aspectRatio.width / aspectRatio.height
    : 1
}

function getViewKey(view: app.bsky.embed.external.ViewExternal) {
  return view.associatedRefs?.[0]?.uri ?? view.uri
}
