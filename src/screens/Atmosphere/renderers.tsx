import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {ActivityPublicationCardBody} from './components/ActivityBodyContent'
import {
  ActivityRow,
  ActivityRowHeader,
  ActivityRowHeaderText,
} from './components/ActivityHeader'
import {
  DocumentActivityRenderer,
  RecommendationActivityRenderer,
} from './components/ArticleActivity'
import {GrainGalleryActivityRenderer} from './components/PhotoActivity'
import {ShareActivityRenderer} from './components/ShareActivity'
import {LivestreamActivityRenderer} from './components/StreamActivity'
import {SubscriptionActivityRenderer} from './components/SubscriptionActivity'
import {type ActivityGroupRowItem} from './model'
import {
  type ActivityPresentationItem,
  type ActivityPresentationProps,
} from './presentation'
import {
  activityCollections,
  isKnownActivityCollection,
  type KnownActivityCollection,
} from './types'

export type ActivityRendererProps = ActivityPresentationProps & {
  hideTopBorder: boolean
  testID: string
  actions?: React.ReactNode
}

export type ActivityRenderer = React.ComponentType<ActivityRendererProps>

export const activityRenderers: Record<
  KnownActivityCollection,
  ActivityRenderer
> = {
  [activityCollections.document]: DocumentActivityRenderer,
  [activityCollections.publication]: PublicationActivityRenderer,
  [activityCollections.recommendation]: RecommendationActivityRenderer,
  [activityCollections.subscription]: SubscriptionActivityRenderer,
  [activityCollections.livestream]: LivestreamActivityRenderer,
  [activityCollections.grainGallery]: GrainGalleryActivityRenderer,
  [activityCollections.grainFavorite]: GrainGalleryActivityRenderer,
  [activityCollections.share]: ShareActivityRenderer,
}

const activityRowTestIDs: Record<KnownActivityCollection, string> = {
  [activityCollections.document]: 'atmosphereDocumentRow',
  [activityCollections.publication]: 'atmospherePublicationRow',
  [activityCollections.recommendation]: 'atmosphereRecommendationRow',
  [activityCollections.subscription]: 'atmosphereSubscriptionRow',
  [activityCollections.livestream]: 'atmosphereLivestreamRow',
  [activityCollections.grainGallery]: 'atmosphereGrainGalleryRow',
  [activityCollections.grainFavorite]: 'atmosphereGrainFavoriteRow',
  [activityCollections.share]: 'atmosphereShareRow',
}

export function getActivityRendererTestID(collection: string) {
  return isKnownActivityCollection(collection)
    ? activityRowTestIDs[collection]
    : 'atmosphereUnknownRow'
}

export function UnknownActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  actions,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader
        item={item}
        computedItemView={computedItemView}
        actions={actions}>
        <ActivityRowHeaderText>{l`did something`}</ActivityRowHeaderText>
      </ActivityRowHeader>
    </ActivityRow>
  )
}

function PublicationActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  actions,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActorGroup(item)
    ? l`${plural(getGroupCount(item), {one: 'created # publication', other: 'created # publications'})}`
    : isSubjectGroup(item)
      ? l`did something with a publication`
      : l`created a publication`
  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader
        item={item}
        computedItemView={computedItemView}
        actions={actions}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityPublicationCardBody
        item={item}
        computedItemView={computedItemView}
      />
    </ActivityRow>
  )
}

function isActorGroup(
  item: ActivityPresentationItem,
): item is ActivityGroupRowItem & {group: {groupBy: 'actor'}} {
  return item.type === 'group' && item.group.groupBy === 'actor'
}

function isSubjectGroup(
  item: ActivityPresentationItem,
): item is ActivityGroupRowItem & {group: {groupBy: 'subject'}} {
  return item.type === 'group' && item.group.groupBy === 'subject'
}

function getGroupCount(item: ActivityPresentationItem) {
  return item.type === 'group' ? item.group.items.length : 1
}
