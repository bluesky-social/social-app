import {
  getActivityCollection,
  type PresentableActivityRowItem,
} from '../presentation'
import {
  activityRenderers,
  getActivityRendererTestID,
  UnknownActivityRenderer,
} from '../renderers'
import {isKnownActivityCollection} from '../types'

export function ActivityPresentationRow({
  item,
  hideTopBorder,
}: {
  item: PresentableActivityRowItem
  hideTopBorder: boolean
}) {
  const collection = getActivityCollection(item)
  const Renderer = isKnownActivityCollection(collection)
    ? activityRenderers[collection]
    : UnknownActivityRenderer

  return (
    <Renderer
      item={item}
      actorPresentation={item.actorPresentation}
      hideTopBorder={hideTopBorder}
      testID={getActivityRendererTestID(collection)}
    />
  )
}
