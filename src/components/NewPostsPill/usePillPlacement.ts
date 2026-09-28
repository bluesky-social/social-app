import {useContext} from 'react'
import {
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import {HITSLOP_20} from '#/lib/constants'
import {useShellLayout} from '#/state/shell/shell-layout'
import {PagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {
  useHomeHeaderMode,
  useHomeHeaderPinnedHeight,
} from '#/view/com/util/MainScrollProvider'
import {atoms as a} from '#/alf'
import {
  homeHeaderBottom,
  NEW_POSTS_PILL_HEADER_GAP,
  pagerHeaderBottom,
} from '#/components/NewPostsPill/placement'

/** Pass as `NewPostsPill`'s `style`. */
export type NewPostsPillPlacementStyle = StyleProp<AnimatedStyle<ViewStyle>>

/*
 * A full-width strip whose top edge is translated onto the header's effective
 * bottom edge. It clips, so the pill slides out from behind that edge and back
 * behind it even where the header is transparent: a plain `Layout.Header` on
 * native, or the collapsed Home header under liquid glass, where anything
 * above the edge would show under the Dynamic Island. The bottom padding keeps
 * the pill's hit slop inside the clip; the strip itself takes no touches.
 *
 * Translate only: the edge moves every scroll frame, and a transform moves it
 * without a layout pass. Nothing here touches opacity, which would stop the
 * glass from rendering.
 */
const strip = [
  a.absolute,
  a.overflow_hidden,
  a.z_10,
  {
    top: 0,
    left: 0,
    right: 0,
    paddingTop: NEW_POSTS_PILL_HEADER_GAP,
    paddingBottom: HITSLOP_20.bottom,
  },
]

/**
 * Places a `NewPostsPill` beneath the Home header, following it as it
 * collapses and coming to rest under its pinned strip rather than hiding with
 * it. Render the pill in a Home feed page, after its list.
 *
 * Deliberately not `useHomeHeaderTransform`: that also fades the header, stops
 * it taking touches, and under liquid glass drives `top` for the header's scroll
 * edge effect, which would put the pill at the top of the screen.
 *
 * @platform ios, android
 */
export function useHomeHeaderPillPlacement(): {
  style: NewPostsPillPlacementStyle
} {
  const mode = useHomeHeaderMode()
  const {headerHeight} = useShellLayout()
  const pinnedHeight = useHomeHeaderPinnedHeight()
  const follow = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: homeHeaderBottom({
          mode: mode.get(),
          headerHeight: headerHeight.get(),
          pinnedHeight,
        }),
      },
    ],
  }))
  return {style: [strip, follow]}
}

/**
 * Places a `NewPostsPill` beneath a `PagerWithHeader` header and its tab bar,
 * following the header's collapse and over-scroll exactly. Render the pill in
 * a page, after its list, and pass the page's `headerHeight`; only the focused
 * page should offer one.
 *
 * Outside a pager there is no collapse to follow, so the pill stays beneath
 * `headerHeight`: a page component can also serve a screen whose header is
 * static, as a moderation list's About section does.
 *
 * @platform ios, android
 */
export function usePagerHeaderPillPlacement({
  headerHeight,
}: {
  /** The whole header, tab bar included, as `PagerWithHeader` passes it. */
  headerHeight: number
}): {
  style: NewPostsPillPlacementStyle
} {
  const ctx = useContext(PagerHeaderContext)
  const still = useSharedValue(0)
  const scrollY = ctx?.scrollY ?? still
  const minimumHeaderHeight = ctx?.minimumHeaderHeight ?? still
  const headerOnlyHeight = ctx?.headerHeight ?? 0
  const allowHeaderOverScroll = ctx?.allowHeaderOverScroll ?? false
  const follow = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: pagerHeaderBottom({
          headerHeight,
          scrollY: scrollY.get(),
          headerOnlyHeight,
          minimumHeaderHeight: minimumHeaderHeight.get(),
          allowHeaderOverScroll,
        }),
      },
    ],
  }))
  return {style: [strip, follow]}
}

/**
 * Places a `NewPostsPill` beneath a plain screen header such as
 * `Layout.Header`, which stays put on native.
 *
 * Where the pill shares a parent with the header, pass `onHeaderLayout` to the
 * header (`Layout.Header.Outer` takes `onLayout`) so the pill clears it and any
 * inset above it. Where the pill's parent already begins below the header, as
 * inside a pager page under an in-flow tab bar, leave it unattached.
 *
 * @platform ios, android
 */
export function useScreenHeaderPillPlacement(): {
  style: NewPostsPillPlacementStyle
  onHeaderLayout: (e: LayoutChangeEvent) => void
} {
  const headerBottom = useSharedValue(0)
  const follow = useAnimatedStyle(() => ({
    transform: [{translateY: headerBottom.get()}],
  }))
  const onHeaderLayout = (e: LayoutChangeEvent) => {
    const {y, height} = e.nativeEvent.layout
    headerBottom.set(y + height)
  }
  return {style: [strip, follow], onHeaderLayout}
}
