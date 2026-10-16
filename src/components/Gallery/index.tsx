import {
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import flattenReactChildren from 'react-keyed-flatten-children'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useA11y} from '#/state/a11y'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, web} from '#/alf'
import {Bleed, useGalleryBleed} from '#/components/Gallery/Bleed'
import {ITEM_GAP} from '#/components/Gallery/const'
import {type GalleryRef} from '#/components/Gallery/types'
import {useKeyboardHandlers} from '#/components/Gallery/useKeyboardHandlers'
import {usePointerHandlers} from '#/components/Gallery/usePointerHandlers'
import {getIndexForOffset, getRevealOffset} from '#/components/Gallery/utils'
import {IS_ANDROID, IS_WEB} from '#/env'

export {Bleed, useGalleryBleed}
export {ITEM_GAP}
export type {GalleryRef}

type Size = {width: number; height: number}

/**
 * Props for the element in a carousel slide that should receive keyboard
 * focus, for slides that have a specific interactive element (e.g. a
 * `Pressable`). Attach `focusRef` and `tabIndex` to it, and call `onFocus`
 * from its own `onFocus`.
 */
export type ItemFocusProps = {
  focusRef: React.RefCallback<unknown>
  tabIndex: 0 | -1 | undefined
  onFocus: () => void
}

const ItemContext = createContext<{
  itemKey: string
  index: number
  /** Whether this is the one slide that is tab-focusable on web */
  isFocusTarget: boolean
  /** Whether to apply a roving tabIndex at all */
  rovingEnabled: boolean
  onItemLayout: (key: string, size: Size) => void
  registerFocusNode: (key: string, node: unknown) => void
  onItemFocus: (index: number) => void
} | null>(null)
ItemContext.displayName = 'GalleryItemContext'

/**
 * A horizontal strip of arbitrary content. Each child must render a
 * `Gallery.Item`. Children own their width and height; the strip is as tall
 * as the tallest one.
 *
 * Children are all rendered eagerly, so this is meant for a small number of
 * items rather than an unbounded list.
 */
export function Root({
  children,
  label,
  testID,
  ref,
  onIndexChange,
}: {
  children?: React.ReactNode
  /** Translated accessible label for the whole gallery */
  label: string
  testID?: string
  ref?: React.Ref<GalleryRef>
  /**
   * Called when the user navigates to a different item via native swipe,
   * mouse drag, arrow keys, or Safari horizontal wheel events. Browser touch
   * and non-Safari wheel scrolling do not report index changes. Not called on
   * mount, for `scrollIntoView`, when focus
   * simply lands on an item, or when items are added, removed, or reordered.
   */
  onIndexChange?: (index: number, previousIndex: number) => void
}) {
  const {t: l} = useLingui()
  const {screenReaderEnabled} = useA11y()

  const slides = flattenReactChildren(children).filter(isValidElement)
  const keys = slides.map(slide => String(slide.key))
  const keysSignature = keys.join('\u0000')
  const itemCount = keys.length

  const [sizes, setSizes] = useState<Map<string, Size>>(() => new Map())
  const [focusIndex, setFocusIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null)
  const itemWidthsRef = useRef<Map<number, number>>(new Map())
  const focusNodesRef = useRef<Map<string, unknown>>(new Map())
  const currentIndexRef = useRef(0)
  const activeKeyRef = useRef<string | null>(keys[0] ?? null)
  const scrollOffsetRef = useRef(0)
  const userScrollingRef = useRef(false)

  /*
   * Container overflow styles
   *
   * Uses measureLayout to get the Gallery's offset relative to the Bleed
   * ancestor, if any. This is a layout-relative measurement that doesn't
   * depend on scroll position, so it works correctly for off-screen items.
   */
  const {bleedRef, bleedWidth} = useGalleryBleed()
  const contentRef = useRef<React.ComponentRef<typeof View>>(null)
  const [contentDims, setContentDims] = useState<{x: number; width: number}>()
  const measure = useNonReactiveCallback(() => {
    if (contentRef.current && bleedRef.current) {
      contentRef.current.measureLayout(
        bleedRef.current,
        (x, _y, w) => {
          setContentDims(prev =>
            prev && prev.x === x && prev.width === w ? prev : {x, width: w},
          )
        },
        () => {},
      )
    }
  })
  useEffect(() => {
    measure()
  }, [bleedWidth, measure])
  const isBleeding = bleedWidth > 0
  const insetLeft = isBleeding ? (contentDims?.x ?? 0) : 0
  const insetRight = isBleeding
    ? Math.max(0, bleedWidth - insetLeft - (contentDims?.width ?? 0))
    : 0
  /* End container overflow styles */

  /*
   * The offset math works on indexes, but measurements are stored by key so
   * they follow items through reordering.
   */
  const itemWidths = new Map<number, number>()
  let maxHeight = 0
  keys.forEach((key, index) => {
    const size = sizes.get(key)
    itemWidths.set(index, size?.width ?? 0)
    maxHeight = Math.max(maxHeight, size?.height ?? 0)
  })
  useLayoutEffect(() => {
    itemWidthsRef.current = itemWidths
  })

  const getScrollNode = () =>
    scrollRef.current?.getScrollableNode() as unknown as HTMLElement | null

  const scrollTo = useNonReactiveCallback((offset: number) => {
    scrollRef.current?.scrollTo({x: offset, animated: false})
  })

  /** Sync the active index without telling anyone */
  const syncIndex = useNonReactiveCallback((index: number) => {
    currentIndexRef.current = index
    activeKeyRef.current = keys[index] ?? null
  })

  const setCurrentIndex = useNonReactiveCallback((index: number) => {
    const prev = currentIndexRef.current
    if (prev === index) return
    syncIndex(index)
    onIndexChange?.(index, prev)
  })

  /*
   * Items can come and go, and move around. Keep the active index on the item
   * it was on if that's still here, otherwise stay in range. This isn't the
   * user going anywhere, so nobody is notified.
   */
  useEffect(() => {
    const currentKeys = keysSignature ? keysSignature.split('\u0000') : []
    const present = new Set(currentKeys)
    setSizes(prev => {
      let changed = false
      const next = new Map<string, Size>()
      prev.forEach((size, key) => {
        if (present.has(key)) next.set(key, size)
        else changed = true
      })
      return changed ? next : prev
    })
    focusNodesRef.current.forEach((_node, key) => {
      if (!present.has(key)) focusNodesRef.current.delete(key)
    })
    const survivedAt =
      activeKeyRef.current != null
        ? currentKeys.indexOf(activeKeyRef.current)
        : -1
    const next =
      survivedAt !== -1
        ? survivedAt
        : Math.max(0, Math.min(currentIndexRef.current, currentKeys.length - 1))
    currentIndexRef.current = next
    activeKeyRef.current = currentKeys[next] ?? null
    setFocusIndex(next)
  }, [keysSignature])

  /*
   * Keeps the item the lightbox (or any other consumer) is showing in view.
   * Non-reactive because consumers hold onto it, and the layout can change
   * underneath (e.g. on rotation).
   */
  const scrollIntoView = useNonReactiveCallback((index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= itemCount) return
    // Web scrolls outside of onScroll (see the web hooks), so read it live.
    const current = IS_WEB
      ? (getScrollNode()?.scrollLeft ?? 0)
      : scrollOffsetRef.current
    const next = getRevealOffset({
      itemWidths: itemWidthsRef.current,
      itemCount,
      index,
      viewportWidth,
      currentOffset: current,
    })
    if (next === current) return
    if (!IS_WEB) {
      /*
       * Sync the index up front so the jump isn't counted as a swipe. Web's
       * index tracks keyboard focus instead, which stays put.
       */
      syncIndex(getIndexForOffset(itemWidthsRef.current, next, itemCount))
    }
    scrollTo(next)
  })

  useImperativeHandle(ref, () => ({scrollIntoView}), [scrollIntoView])

  const onSettle = useNonReactiveCallback((index: number) => {
    setCurrentIndex(index)
    if (!IS_WEB) return
    setFocusIndex(index)
    const node = focusNodesRef.current.get(keys[index]) as HTMLElement | null
    // Don't pull focus away from something else on the page
    const active = document.activeElement
    const scrollNode = getScrollNode()
    const focusIsFree =
      !active || active === document.body || !!scrollNode?.contains(active)
    if (focusIsFree) node?.focus?.({preventScroll: true})
  })

  /*
   * Focus landing on an item (e.g. a click right before opening a lightbox)
   * isn't navigation, so this only keeps the keyboard target in sync.
   */
  const onItemFocus = useNonReactiveCallback((index: number) => {
    if (!IS_WEB) return
    syncIndex(index)
    setFocusIndex(index)
  })

  const onItemLayout = useNonReactiveCallback((key: string, size: Size) => {
    setSizes(prev => {
      const existing = prev.get(key)
      if (
        existing &&
        existing.width === size.width &&
        existing.height === size.height
      ) {
        return prev
      }
      const next = new Map(prev)
      next.set(key, size)
      return next
    })
  })

  const registerFocusNode = useNonReactiveCallback(
    (key: string, node: unknown) => {
      if (node) focusNodesRef.current.set(key, node)
      else focusNodesRef.current.delete(key)
    },
  )

  useKeyboardHandlers({
    scrollRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    itemCount,
    resetKey: keysSignature,
  })

  usePointerHandlers({
    scrollRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    itemCount,
    resetKey: keysSignature,
  })

  /*
   * Only count scrolls the user is doing. The rest are programmatic, or the
   * platform adjusting after a layout change, and just keep the index in sync.
   */
  const onScrollOffset = (offsetX: number, isUserScroll: boolean) => {
    scrollOffsetRef.current = offsetX
    const index = getIndexForOffset(itemWidthsRef.current, offsetX, itemCount)
    if (isUserScroll) {
      setCurrentIndex(index)
    } else {
      syncIndex(index)
    }
  }

  // web handles via onSettle in the web hooks
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (IS_WEB) return
    onScrollOffset(e.nativeEvent.contentOffset.x, userScrollingRef.current)
  }

  /*
   * A drag, and any momentum that follows it, are the user. The end events
   * carry the final offset, which is counted before the flag is cleared so a
   * last movement isn't lost to event ordering. Platforms don't agree on
   * whether (or what) velocity is reported, so the drag ending always clears
   * the flag, and momentum beginning sets it again.
   */
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!IS_WEB) onScrollOffset(e.nativeEvent.contentOffset.x, true)
    userScrollingRef.current = false
  }

  const activeFocusIndex = Math.min(focusIndex, Math.max(0, itemCount - 1))
  const rovingEnabled = IS_WEB && !screenReaderEnabled

  return (
    <View
      ref={contentRef}
      testID={testID}
      style={[
        a.w_full,
        {
          height: maxHeight > 0 ? maxHeight : undefined,
          overflow: 'visible',
        },
      ]}
      onLayout={(e: LayoutChangeEvent) => {
        setViewportWidth(e.nativeEvent.layout.width)
        measure()
      }}>
      <BlockDrawerGesture>
        <ScrollView
          ref={scrollRef}
          role="group"
          aria-roledescription={l`carousel`}
          aria-label={label}
          horizontal
          pagingEnabled={false}
          /*
           * Snap back to 0 if Android stretch overscroll leaves the carousel
           * slightly off the left edge, without disabling native stretching.
           */
          overScrollMode="auto"
          snapToOffsets={IS_ANDROID ? [0] : undefined}
          snapToEnd={false}
          showsHorizontalScrollIndicator={false}
          directionalLockEnabled
          nestedScrollEnabled
          alwaysBounceVertical={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollBeginDrag={() => {
            userScrollingRef.current = true
          }}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollBegin={() => {
            userScrollingRef.current = true
          }}
          onMomentumScrollEnd={onScrollEnd}
          style={[
            // Native scroll views grow to fill their parent by default
            {flexGrow: 0},
            isBleeding && {width: bleedWidth, marginLeft: -insetLeft},
            /*
             * Prevent Chrome/Firefox horizontal swipes from triggering browser
             * history navigation. Safari ignores overscroll-behavior, so its
             * wheel listener in usePointerHandlers.web.ts handles this.
             */
            web({overscrollBehaviorX: 'contain'}),
          ]}
          contentContainerStyle={[
            a.align_start,
            {
              gap: ITEM_GAP,
              paddingLeft: insetLeft,
              paddingRight: insetRight,
            },
          ]}>
          {slides.map((slide, index) => (
            <ItemContext.Provider
              key={keys[index]}
              value={{
                itemKey: keys[index],
                index,
                isFocusTarget: index === activeFocusIndex,
                rovingEnabled,
                onItemLayout,
                registerFocusNode,
                onItemFocus,
              }}>
              {slide}
            </ItemContext.Provider>
          ))}
        </ScrollView>
      </BlockDrawerGesture>
    </View>
  )
}

/**
 * One slide. Measured at whatever size its children take up, so it never
 * imposes a width or height. Pass a function as children to receive props for
 * attaching to an interactive element that should be the keyboard focus target
 * for this slide, instead of the slide itself.
 */
export function Item({
  children,
  label,
  testID,
}: {
  children: React.ReactNode | ((focusProps: ItemFocusProps) => React.ReactNode)
  label?: string
  testID?: string
}) {
  const {t: l} = useLingui()
  const ctx = useContext(ItemContext)
  if (!ctx) {
    throw new Error('Gallery.Item must be rendered inside Gallery.Root')
  }
  const {
    itemKey,
    index,
    isFocusTarget,
    rovingEnabled,
    onItemLayout,
    registerFocusNode,
    onItemFocus,
  } = ctx

  const tabIndex = rovingEnabled ? (isFocusTarget ? 0 : -1) : undefined
  const focusRef: React.RefCallback<unknown> = node => {
    registerFocusNode(itemKey, node)
    return () => registerFocusNode(itemKey, null)
  }
  const onFocus = () => onItemFocus(index)

  const renderFocusTarget = typeof children === 'function'

  return (
    <View
      testID={testID}
      collapsable={false}
      role="group"
      aria-roledescription={l`slide`}
      aria-label={label}
      {...(renderFocusTarget
        ? null
        : {
            ref: focusRef,
            tabIndex,
            ...(IS_WEB ? {onFocus} : null),
          })}
      style={[a.flex_shrink_0, a.self_start]}
      onLayout={(e: LayoutChangeEvent) => {
        const {width, height} = e.nativeEvent.layout
        onItemLayout(itemKey, {width, height})
      }}>
      {renderFocusTarget ? children({focusRef, tabIndex, onFocus}) : children}
    </View>
  )
}
