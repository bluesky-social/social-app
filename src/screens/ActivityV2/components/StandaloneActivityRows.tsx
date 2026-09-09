import {
  type activityCollections,
  type ActivityItem,
  type CollectionActivityItem,
} from '../types'
import {ActivityV2PreviewRow} from './ActivityV2PreviewRow'

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
    <ActivityV2PreviewRow
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
      testID="activityV2DocumentRow"
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
      testID="activityV2PublicationRow"
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
      testID="activityV2RecommendationRow"
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
      testID="activityV2SubscriptionRow"
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
      testID="activityV2LivestreamRow"
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
      testID="activityV2GrainPhotoRow"
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
    <ActivityV2PreviewRow
      hideTopBorder={hideTopBorder}
      preview={JSON.stringify(activity) ?? ''}
      testID="activityV2UnknownRow"
    />
  )
}
