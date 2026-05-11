import {type LayoutChangeEvent, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ScrollEdgeEffect} from '@bsky.app/expo-scroll-edge-effect'

import {atoms as a} from '#/alf'
import {MessagesListHeader} from '#/components/dms/MessagesListHeader'
import {type ConvoWithDetails} from '#/components/dms/util'
import {IS_LIQUID_GLASS} from '#/env'

/**
 * Without `onLayout`, this is a plain in-flow header used for static surfaces
 * (e.g. the error screen). With `onLayout`, it becomes the floating variant
 * that overlays the scrollable list with a Liquid Glass material; the caller
 * uses the measured height to compensate via `contentInset.top` on the list.
 *
 * On non-Liquid Glass platforms the floating variant collapses back to an
 * in-flow header (the top inset is handled by `Layout.Screen` there), and
 * `onLayout` is therefore not attached.
 */
export function ConvoHeader({
  convo,
  onLayout,
}: {
  convo: ConvoWithDetails | null
  onLayout?: (e: LayoutChangeEvent) => void
}) {
  const {top: topInset} = useSafeAreaInsets()

  if (onLayout && IS_LIQUID_GLASS) {
    return (
      <ScrollEdgeEffect
        edge="top"
        style={[a.absolute, a.w_full, a.z_10, {paddingTop: topInset}]}
        onLayout={onLayout}>
        <MessagesListHeader convo={convo} />
      </ScrollEdgeEffect>
    )
  }

  if (onLayout) {
    return <MessagesListHeader convo={convo} />
  }

  return (
    <View style={IS_LIQUID_GLASS && {paddingTop: topInset}}>
      <MessagesListHeader convo={convo} />
    </View>
  )
}
