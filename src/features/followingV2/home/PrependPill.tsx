import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {plural} from '@lingui/core/macro'

import {HITSLOP_20} from '#/lib/constants'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useHomeHeaderMode} from '#/view/com/util/MainScrollProvider'
import {atoms as a} from '#/alf'
import {NewPostsPill, type NewPostsPillAuthor} from '#/components/NewPostsPill'
import {IS_LIQUID_GLASS} from '#/env'

/** Space between the bottom edge of the Home header and the pill. */
const HEADER_GAP = 16

/*
 * A full-width strip whose top edge sits on the header's bottom edge. It
 * clips, so the pill slides out from behind that edge, and back behind it,
 * even under liquid glass, where the collapsed header leaves only a
 * transparent strip under the status bar. The bottom padding keeps the pill's
 * hit slop inside the clip. The strip itself takes no touches.
 */
const strip = [
  a.absolute,
  a.overflow_hidden,
  a.z_10,
  {
    top: 0,
    left: 0,
    right: 0,
    paddingTop: HEADER_GAP,
    paddingBottom: HITSLOP_20.bottom,
  },
]

/**
 * The new posts pill for the posts anchored Following puts on top on Home (see
 * `usePrependPill`), beneath the Home header. It follows the header as it
 * collapses, as `useHomeHeaderTransform` moves it, and comes to rest under the
 * part of the header that stays on screen rather than hiding with it. Render
 * it in a Home feed page, after its list.
 *
 * @platform ios, android
 */
export function PrependPill({
  visible,
  count,
  authors,
  onPress,
}: {
  visible: boolean
  count: number
  authors: NewPostsPillAuthor[]
  onPress: () => void
}) {
  const mode = useHomeHeaderMode()
  const {headerHeight} = useShellLayout()
  const {top: topInset} = useSafeAreaInsets()
  // As `useHomeHeaderTransform` has it.
  const pinnedHeight = IS_LIQUID_GLASS ? topInset : 0
  // Translate only: a transform moves it without a layout pass every frame.
  const follow = useAnimatedStyle(() => {
    const height = headerHeight.get()
    return {
      transform: [{translateY: height + mode.get() * (pinnedHeight - height)}],
    }
  })

  return (
    <Animated.View pointerEvents="box-none" style={[strip, follow]}>
      <NewPostsPill
        testID="followingPrependPill"
        visible={visible}
        count={count}
        authors={authors}
        // Its posts are loaded already, so pressing it shows them.
        label={plural(count, {
          one: 'Show # new post',
          other: 'Show # new posts',
        })}
        onPress={onPress}
      />
    </Animated.View>
  )
}
