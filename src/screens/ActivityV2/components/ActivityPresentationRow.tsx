import {type ActivityPresentationProps} from '../presentation'
import {
  activityRenderers,
  getActivityRendererTestID,
  UnknownActivityRenderer,
} from '../renderers'
import {isKnownActivityCollection} from '../types'

export function ActivityPresentationRow({
  computedItemView,
  hideTopBorder,
  item,
}: ActivityPresentationProps & {
  hideTopBorder: boolean
}) {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  const Renderer = isKnownActivityCollection(collection)
    ? activityRenderers[collection]
    : UnknownActivityRenderer

  return (
    <Renderer
      item={item}
      computedItemView={computedItemView}
      hideTopBorder={hideTopBorder}
      testID={getActivityRendererTestID(collection)}
    />
  )
}
