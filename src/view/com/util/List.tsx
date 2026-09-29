import {forwardRef, memo, useDeferredValue, useMemo} from 'react'
import {type ListViewToken as ViewToken, RefreshControl} from 'react-native'
import {
  type FlatListPropsWithLayout,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {updateActiveVideoViewAsync} from '@bsky.app/video'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isAtTopOffset, type ListScrollPosition} from '#/lib/listMotion'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {addStyle} from '#/lib/styles'
import {useTheme} from '#/alf'
import {useLightbox} from '#/components/Lightbox/state'
import {IS_IOS} from '#/env'
import {FlatList_INTERNAL} from './Views'

export type ListMethods = FlatList_INTERNAL
// This is a generic type; we could update ~30 call sites but this approach is consistent with RN internals. -dsb
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListProps<ItemT = any> = Omit<
  FlatListPropsWithLayout<ItemT>,
  | 'onMomentumScrollBegin' // Use ScrollContext instead.
  | 'onMomentumScrollEnd' // Use ScrollContext instead.
  | 'onScroll' // Use ScrollContext instead.
  | 'onScrollBeginDrag' // Use ScrollContext instead.
  | 'onScrollEndDrag' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
  | 'progressViewOffset' // Can't be an animated value
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  headerOffset?: number
  refreshing?: boolean
  onRefresh?: () => void
  onItemSeen?: (item: ItemT) => void
  desktopFixedHeight?: number | boolean
  // Web only prop to contain the scroll to the container rather than the window
  disableFullWindowScroll?: boolean
  sideBorders?: boolean
  progressViewOffset?: number
  /** Fired once, on the first scroll event the list reports. */
  onFirstScroll?: () => void
  /**
   * Native only: a finger started dragging the list. Together with
   * {@link onScrollGestureEnd} this brackets the list moving under the reader,
   * the deceleration after the drag included.
   */
  onScrollGestureBegin?: () => void
  /**
   * Native only: the list came to rest after a drag, where it came to rest -
   * at the end of a drag released without velocity, or at the end of the
   * deceleration otherwise, which on iOS also ends an animated scroll the app
   * started.
   */
  onScrollGestureEnd?: (position: ListScrollPosition) => void
  /**
   * Native only: every scroll event the list dispatches, whatever caused it,
   * with where the list is. The only way to tell a list that has stopped from
   * one whose offset is between corrections. Costs a hop to the JS thread per
   * event, so only wired when given.
   */
  onScrollActivity?: (position: ListScrollPosition) => void
  /**
   * Native only: the list arrived within `LIST_AT_TOP_LIMIT` of its top,
   * possibly still moving. Not fired for the list being there on mount, which
   * is not arriving anywhere.
   */
  onReachedTop?: () => void
}
export type ListRef = React.RefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

/** Where the list is, read on the UI thread so only plain values cross. */
function scrollPosition(e: {
  contentOffset: {y: number}
  contentSize: {height: number}
}): ListScrollPosition {
  'worklet'
  return {offsetY: e.contentOffset.y, contentHeight: e.contentSize.height}
}

let List = forwardRef<ListMethods, ListProps>(
  (
    {
      onScrolledDownChange,
      onFirstScroll,
      onScrollGestureBegin,
      onScrollGestureEnd,
      onScrollActivity,
      onReachedTop,
      refreshing,
      onRefresh,
      onItemSeen,
      headerOffset,
      style,
      progressViewOffset,
      automaticallyAdjustsScrollIndicatorInsets = false,
      ...props
    },
    ref,
  ): React.ReactElement => {
    const isScrolledDown = useSharedValue(false)
    const hasScrolled = useSharedValue(false)
    /*
     * Starts at the top so that only an arrival is reported: on iOS the first
     * event is the resting offset being applied, which is not the reader going
     * anywhere.
     */
    const isAtTop = useSharedValue(true)
    const t = useTheme()
    const dedupe = useDedupe(400)
    const scrollsToTop = useAllowScrollToTop()

    const handleScrolledDownChange = useNonReactiveCallback(
      (didScrollDown: boolean) => {
        onScrolledDownChange?.(didScrollDown)
      },
    )
    const handleFirstScroll = useNonReactiveCallback(() => {
      onFirstScroll?.()
    })
    const handleScrollGestureBegin = useNonReactiveCallback(() => {
      onScrollGestureBegin?.()
    })
    const handleScrollGestureEnd = useNonReactiveCallback(
      (position: ListScrollPosition) => {
        onScrollGestureEnd?.(position)
      },
    )
    const handleScrollActivity = useNonReactiveCallback(
      (position: ListScrollPosition) => {
        onScrollActivity?.(position)
      },
    )
    const handleReachedTop = useNonReactiveCallback(() => {
      onReachedTop?.()
    })

    // Intentionally destructured outside the main thread closure.
    // See https://github.com/bluesky-social/social-app/pull/4108.
    const {
      onBeginDrag: onBeginDragFromContext,
      onEndDrag: onEndDragFromContext,
      onScroll: onScrollFromContext,
      onMomentumEnd: onMomentumEndFromContext,
    } = useScrollHandlers()
    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag(e, ctx) {
        onBeginDragFromContext?.(e, ctx)

        if (onScrollGestureBegin != null) {
          scheduleOnRN(handleScrollGestureBegin)
        }
      },
      onEndDrag(e, ctx) {
        scheduleOnRN(updateActiveVideoViewAsync)
        onEndDragFromContext?.(e, ctx)

        /*
         * Released with velocity, the list decelerates, and `onMomentumEnd`
         * reports where it comes to rest. The same rule
         * `MainScrollProvider.onEndDrag` snaps by.
         */
        if (onScrollGestureEnd != null && !e.velocity?.y) {
          scheduleOnRN(handleScrollGestureEnd, scrollPosition(e))
        }
      },
      onScroll(e, ctx) {
        onScrollFromContext?.(e, ctx)

        if (onScrollActivity != null) {
          scheduleOnRN(handleScrollActivity, scrollPosition(e))
        }

        if (onReachedTop != null) {
          const didReachTop = isAtTopOffset(e.contentOffset.y)
          if (isAtTop.get() !== didReachTop) {
            isAtTop.set(didReachTop)
            if (didReachTop) {
              scheduleOnRN(handleReachedTop)
            }
          }
        }

        if (onFirstScroll != null && !hasScrolled.get()) {
          hasScrolled.set(true)
          scheduleOnRN(handleFirstScroll)
        }

        const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
        if (isScrolledDown.get() !== didScrollDown) {
          isScrolledDown.set(didScrollDown)
          if (onScrolledDownChange != null) {
            scheduleOnRN(handleScrolledDownChange, didScrollDown)
          }
        }

        if (IS_IOS) {
          scheduleOnRN(dedupe, updateActiveVideoViewAsync)
        }
      },
      // Note: adding onMomentumBegin here makes simulator scroll
      // lag on Android. So either don't add it, or figure out why.
      onMomentumEnd(e, ctx) {
        scheduleOnRN(updateActiveVideoViewAsync)
        onMomentumEndFromContext?.(e, ctx)

        if (onScrollGestureEnd != null) {
          scheduleOnRN(handleScrollGestureEnd, scrollPosition(e))
        }
      },
    })

    const [onViewableItemsChanged, viewabilityConfig] = useMemo(() => {
      if (!onItemSeen) {
        return [undefined, undefined]
      }
      return [
        (info: {
          viewableItems: Array<ViewToken>
          changed: Array<ViewToken>
        }) => {
          for (const item of info.changed) {
            if (item.isViewable) {
              onItemSeen(item.item)
            }
          }
        },
        {
          itemVisiblePercentThreshold: 40,
          minimumViewTime: 0.5e3,
        },
      ]
    }, [onItemSeen])

    let refreshControl
    if (refreshing !== undefined || onRefresh !== undefined) {
      refreshControl = (
        <RefreshControl
          key={t.atoms.text.color}
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
          tintColor={t.atoms.text.color}
          titleColor={t.atoms.text.color}
          progressViewOffset={progressViewOffset ?? headerOffset}
        />
      )
    }

    if (headerOffset != null) {
      style = addStyle(style, {
        paddingTop: headerOffset,
      })
    }

    return (
      <FlatList_INTERNAL
        showsVerticalScrollIndicator // overridable
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        {...props}
        automaticallyAdjustsScrollIndicatorInsets={
          automaticallyAdjustsScrollIndicatorInsets
        }
        scrollIndicatorInsets={{
          top: headerOffset,
          right: 1,
          ...props.scrollIndicatorInsets,
        }}
        indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
        refreshControl={refreshControl}
        onScroll={scrollHandler}
        scrollsToTop={scrollsToTop}
        scrollEventThrottle={1}
        style={style}
        ref={ref}
      />
    )
  },
)
List.displayName = 'List'

List = memo(List)
export {List}

// We only want to use this context value on iOS because the `scrollsToTop` prop is iOS-only
// removing it saves us a re-render on Android
const useAllowScrollToTop = IS_IOS ? useAllowScrollToTopIOS : () => undefined
function useAllowScrollToTopIOS() {
  const {activeLightbox} = useLightbox()
  return useDeferredValue(!activeLightbox)
}
