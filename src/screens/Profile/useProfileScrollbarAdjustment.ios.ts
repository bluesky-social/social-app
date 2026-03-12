import {useCallback, useMemo} from 'react'
import {
  type ScrollHandler,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated'

import {useScrollHandlers} from '#/lib/ScrollContext'
import {useShellLayout} from '#/state/shell/shell-layout'

/**
 * Adjusts the scroll indicator insets on iOS to account for the pager header.
 * Adds another scroll offset listener, so use sparingly.
 *
 * HOW TO USE:
 *
 * ```tsx
 * const { scrollHandlers, animatedProps } = useProfileScrollbarAdjustment({
 *   headerHeight: 600, // full size of the header
 *   collapsedHeaderHeight: 200, // height of the header when collapsed
 * })
 *
 * return (
 *   <ScrollContext {...scrollHandlers}>
 *     <List animatedProps={animatedProps} />
 *   </ScrollContext>
 * )
 * ````
 */
export function useProfileScrollbarAdjustment({
  enabled = true,
  headerOffset,
  collapsedHeaderHeight,
}: {
  enabled?: boolean
  headerOffset: number
  collapsedHeaderHeight: number
}) {
  const {onScroll: onScrollFromContext, ...otherScrollHandlers} =
    useScrollHandlers()

  const scrollY = useSharedValue(0)
  const onScroll = useCallback<ScrollHandler<any>>(
    (e, ctx) => {
      'worklet'
      onScrollFromContext?.(e, ctx)
      if (enabled) {
        scrollY.set(e.contentOffset.y)
      }
    },
    [onScrollFromContext, scrollY, enabled],
  )

  const {footerHeight} = useShellLayout()

  const animatedProps = useAnimatedProps(() => {
    return {
      scrollIndicatorInsets: {
        top: enabled
          ? Math.max(headerOffset - scrollY.get(), collapsedHeaderHeight)
          : headerOffset,
        right: 1,
        left: 0,
        bottom: footerHeight.get(),
      },
    }
  })

  const scrollHandlers = useMemo(
    () => ({
      onScroll,
      ...otherScrollHandlers,
    }),
    [onScroll, otherScrollHandlers],
  )

  return {
    scrollHandlers,
    animatedProps,
  }
}
