import {useScrollHandlers} from '#/lib/ScrollContext'

/**
 * Adjusts the scroll indicator insets on iOS to account for the pager header. Adds another scroll offset
 *
 * HOW TO USE:
 *
 * ```tsx
 * const { scrollHandlers, animatedProps } = useScrollbarAdjustment({
 *   headerHeight: 600, // full size of the header
 *   collapsedHeaderHeight: 200, // height of the header when collapsed
 * })
 *
 * return (
 *   <ScrollContext {...scrollHandlers}>
 *     <List animatedProps={animatedProps} />
 *   </ScrollContext>
 * )
 * ```
 *
 * @platform ios
 */
export function useProfileScrollbarAdjustment({}: {
  enabled?: boolean
  headerOffset: number
  collapsedHeaderHeight: number
}): {
  scrollHandlers: ReturnType<typeof useScrollHandlers>
  animatedProps:
    | undefined
    | Partial<{
        scrollIndicatorInsets: {
          top: number
          right: number
          left: number
          bottom: number
        }
      }>
} {
  // this is a no-op version for android/web

  const scrollHandlers = useScrollHandlers()

  const animatedProps = undefined

  return {
    scrollHandlers,
    animatedProps,
  }
}
