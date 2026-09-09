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
  const Renderer = isKnownActivityCollection(computedItemView.rootCollection)
    ? activityRenderers[computedItemView.rootCollection]
    : UnknownActivityRenderer

  return (
    <Renderer
      item={item}
      computedItemView={computedItemView}
      hideTopBorder={hideTopBorder}
      testID={getActivityRendererTestID(computedItemView.rootCollection)}
    />
  )
}
