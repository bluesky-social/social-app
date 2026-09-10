import {
  type activityCollections,
  type ActivityItem,
  type CollectionActivityItem,
} from '../types'
import {AtmospherePreviewRow} from './AtmospherePreviewRow'

type StandaloneActivityRowProps<TCollection extends string> = {
  hideTopBorder: boolean
  activity: CollectionActivityItem<TCollection>
}

function StandaloneActivityPreviewRow<TCollection extends string>({
  activity,
  hideTopBorder,
  testID,
}: StandaloneActivityRowProps<TCollection> & {testID: string}) {
  return (
    <AtmospherePreviewRow
      hideTopBorder={hideTopBorder}
      preview={JSON.stringify(activity) ?? ''}
      testID={testID}
    />
  )
}

export function DocumentActivityRow({
  activity,
  hideTopBorder,
}: StandaloneActivityRowProps<typeof activityCollections.document>) {
  return (
    <StandaloneActivityPreviewRow
      activity={activity}
      hideTopBorder={hideTopBorder}
      testID="atmosphereDocumentRow"
    />
  )
}

export function PublicationActivityRow({
  activity,
  hideTopBorder,
}: StandaloneActivityRowProps<typeof activityCollections.publication>) {
  return (
    <StandaloneActivityPreviewRow
      activity={activity}
      hideTopBorder={hideTopBorder}
      testID="atmospherePublicationRow"
    />
  )
}

export function RecommendationActivityRow({
  activity,
  hideTopBorder,
}: StandaloneActivityRowProps<typeof activityCollections.recommendation>) {
  return (
    <StandaloneActivityPreviewRow
      activity={activity}
      hideTopBorder={hideTopBorder}
      testID="atmosphereRecommendationRow"
    />
  )
}

export function SubscriptionActivityRow({
  activity,
  hideTopBorder,
}: StandaloneActivityRowProps<typeof activityCollections.subscription>) {
  return (
    <StandaloneActivityPreviewRow
      activity={activity}
      hideTopBorder={hideTopBorder}
      testID="atmosphereSubscriptionRow"
    />
  )
}

export function LivestreamActivityRow({
  activity,
  hideTopBorder,
}: StandaloneActivityRowProps<typeof activityCollections.livestream>) {
  return (
    <StandaloneActivityPreviewRow
      activity={activity}
      hideTopBorder={hideTopBorder}
      testID="atmosphereLivestreamRow"
    />
  )
}

export function GrainPhotoActivityRow({
  activity,
  hideTopBorder,
}: StandaloneActivityRowProps<typeof activityCollections.grainPhoto>) {
  return (
    <StandaloneActivityPreviewRow
      activity={activity}
      hideTopBorder={hideTopBorder}
      testID="atmosphereGrainPhotoRow"
    />
  )
}

export function UnknownActivityRow({
  activity,
  hideTopBorder,
}: {
  hideTopBorder: boolean
  activity: ActivityItem
}) {
  return (
    <AtmospherePreviewRow
      hideTopBorder={hideTopBorder}
      preview={JSON.stringify(activity) ?? ''}
      testID="atmosphereUnknownRow"
    />
  )
}
