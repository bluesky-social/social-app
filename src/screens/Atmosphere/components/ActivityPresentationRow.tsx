import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {CircleQuestion_Stroke2_Corner2_Rounded as QuestionIcon} from '#/components/icons/CircleQuestion'
import {getActivityAssociatedPost} from '../activityPost'
import {createAtmosphereDebugItem, isAtmosphereDebugEnabled} from '../debug'
import {type ActivityPresentationProps} from '../presentation'
import {
  activityRenderers,
  getActivityRendererTestID,
  UnknownActivityRenderer,
} from '../renderers'
import {isKnownActivityCollection} from '../types'
import {ActivityActions} from './ActivityActions'

export function ActivityPresentationRow({
  computedItemView,
  hideTopBorder,
  item,
}: ActivityPresentationProps & {
  hideTopBorder: boolean
}) {
  const {t: l} = useLingui()
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  const Renderer = isKnownActivityCollection(collection)
    ? activityRenderers[collection]
    : UnknownActivityRenderer
  const showDebugButton = isAtmosphereDebugEnabled()
  const actor = computedItemView.actors[0]

  return (
    <View style={a.relative}>
      <Renderer
        item={item}
        computedItemView={computedItemView}
        hideTopBorder={hideTopBorder}
        testID={getActivityRendererTestID(collection)}
        actions={
          actor ? (
            <ActivityActions
              actor={actor}
              post={getActivityAssociatedPost(item)}
              rawResponse={
                item.type === 'activity'
                  ? item.activity
                  : (item.rawGroup ?? item.group)
              }
            />
          ) : undefined
        }
      />
      {showDebugButton ? (
        <View style={[a.absolute, a.right_0, a.bottom_0, a.p_xs, a.z_10]}>
          <Button
            label={l`Log activity item`}
            testID="atmosphereDebugButton"
            size="tiny"
            color="secondary"
            shape="round"
            style={[a.transition_opacity, web({opacity: 0})]}
            hoverStyle={web({opacity: 1})}
            onPress={() => console.log(createAtmosphereDebugItem(item))}>
            <ButtonIcon icon={QuestionIcon} size="xs" />
          </Button>
        </View>
      ) : null}
    </View>
  )
}
