import {createContext, useCallback, useContext, useEffect} from 'react'
import {type NativeScrollEvent} from 'react-native'
import {
  clamp,
  interpolate,
  Reanimated3DefaultSpringConfig,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {EventEmitter} from 'eventemitter3'

import {ScrollProvider} from '#/lib/ScrollContext'
import {useShellLayout} from '#/state/shell/shell-layout'
import {IS_LIQUID_GLASS, IS_NATIVE, IS_WEB} from '#/env'

const WEB_HIDE_SHELL_THRESHOLD = 200

const HomeHeaderModeContext = createContext<SharedValue<number> | null>(null)
HomeHeaderModeContext.displayName = 'HomeHeaderModeContext'

export function HomeHeaderModeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const headerMode = useSharedValue(0)
  return (
    <HomeHeaderModeContext.Provider value={headerMode}>
      {children}
    </HomeHeaderModeContext.Provider>
  )
}

export function useHomeHeaderMode() {
  const headerMode = useContext(HomeHeaderModeContext)
  if (!headerMode) {
    throw new Error(
      'useHomeHeaderMode must be used within a HomeHeaderModeProvider',
    )
  }
  return headerMode
}

export function useHomeHeaderTransform() {
  const headerMode = useHomeHeaderMode()
  const {headerHeight} = useShellLayout()
  const {top: topInset} = useSafeAreaInsets()

  const headerPinnedHeight = IS_LIQUID_GLASS ? topInset : 0

  return useAnimatedStyle(() => {
    const headerModeValue = headerMode.get()
    const hHeight = headerHeight.get()

    if (IS_LIQUID_GLASS) {
      // bit of a hackfix, but: the header can get affected by scrollEdgeEffects
      // when animating from closed to open. workaround is to trigger a relayout
      // by offsetting the top position. the actual value doesn't matter, and we
      // simultaneously offset it using the translate transform.
      // I think a cleaner way to do it would be to use UIScrollEdgeElementContainerInteraction
      // manually or something like that, because this kinda sucks -sfn
      const relayoutingOffset = headerModeValue === 0 ? 1 : 0
      return {
        top: relayoutingOffset,
        pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
        opacity: Math.pow(1 - headerModeValue, 2),
        transform: [
          {
            translateY:
              interpolate(
                headerModeValue,
                [0, 1],
                [0, headerPinnedHeight - hHeight],
              ) - relayoutingOffset,
          },
        ],
      }
    }

    return {
      pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(headerModeValue, [0, 1], [0, -hHeight]),
        },
      ],
    }
  })
}

export function MainScrollProvider({children}: {children: React.ReactNode}) {
  const {headerHeight} = useShellLayout()
  const headerMode = useHomeHeaderMode()
  const {top: topInset} = useSafeAreaInsets()
  const headerPinnedHeight = IS_LIQUID_GLASS ? topInset : 0
  const startDragOffset = useSharedValue<number | null>(null)
  const startMode = useSharedValue<number | null>(null)
  const didJustRestoreScroll = useSharedValue<boolean>(false)

  const setMode = useCallback(
    (v: boolean) => {
      'worklet'
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          ...Reanimated3DefaultSpringConfig,
          overshootClamping: true,
        }),
      )
    },
    [headerMode],
  )

  useEffect(() => {
    if (IS_WEB) {
      return listenToForcedWindowScroll(() => {
        startDragOffset.set(null)
        startMode.set(null)
        didJustRestoreScroll.set(true)
      })
    }
  })

  const snapToClosestState = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const offsetY = Math.max(0, e.contentOffset.y)
      if (IS_NATIVE) {
        const startDragOffsetValue = startDragOffset.get()
        if (startDragOffsetValue === null) {
          return
        }
        const didScrollDown = offsetY > startDragOffsetValue
        startDragOffset.set(null)
        startMode.set(null)
        if (offsetY < headerHeight.get()) {
          // If we're close to the top, show the shell.
          setMode(false)
        } else if (didScrollDown) {
          // Showing the bar again on scroll down feels annoying, so don't.
          setMode(true)
        } else {
          // Snap to whichever state is the closest.
          setMode(Math.round(headerMode.get()) === 1)
        }
      }
    },
    [startDragOffset, startMode, setMode, headerMode, headerHeight],
  )

  const onBeginDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const offsetY = Math.max(0, e.contentOffset.y)
      if (IS_NATIVE) {
        startDragOffset.set(offsetY)
        startMode.set(headerMode.get())
      }
    },
    [headerMode, startDragOffset, startMode],
  )

  const onEndDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (IS_NATIVE) {
        if (e.velocity && e.velocity.y !== 0) {
          // If we detect a velocity, wait for onMomentumEnd to snap.
          return
        }
        snapToClosestState(e)
      }
    },
    [snapToClosestState],
  )

  const onMomentumEnd = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (IS_NATIVE) {
        snapToClosestState(e)
      }
    },
    [snapToClosestState],
  )

  const onScroll = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const offsetY = Math.max(0, e.contentOffset.y)
      if (IS_NATIVE) {
        const startDragOffsetValue = startDragOffset.get()
        const startModeValue = startMode.get()
        if (startDragOffsetValue === null || startModeValue === null) {
          if (headerMode.get() !== 0 && offsetY < headerHeight.get()) {
            // If we're close enough to the top, always show the shell.
            // Even if we're not dragging.
            setMode(false)
          }
          return
        }

        // The "mode" value is always between 0 and 1.
        // Figure out how much to move it based on the current dragged distance.
        const dy = offsetY - startDragOffsetValue
        const hideDistance = headerHeight.get() - headerPinnedHeight
        const dProgress = interpolate(
          dy,
          [-hideDistance, hideDistance],
          [-1, 1],
        )
        const newValue = clamp(startModeValue + dProgress, 0, 1)
        if (newValue !== headerMode.get()) {
          // Manually adjust the value. This won't be (and shouldn't be) animated.
          headerMode.set(newValue)
        }
      } else {
        if (didJustRestoreScroll.get()) {
          didJustRestoreScroll.set(false)
          // Don't hide/show navbar based on scroll restoratoin.
          return
        }
        // On the web, we don't try to follow the drag because we don't know when it ends.
        // Instead, show/hide immediately based on whether we're scrolling up or down.
        const dy = offsetY - (startDragOffset.get() ?? 0)
        startDragOffset.set(offsetY)

        if (dy < 0 || offsetY < WEB_HIDE_SHELL_THRESHOLD) {
          setMode(false)
        } else if (dy > 0) {
          setMode(true)
        }
      }
    },
    [
      headerHeight,
      headerPinnedHeight,
      headerMode,
      setMode,
      startDragOffset,
      startMode,
      didJustRestoreScroll,
    ],
  )

  return (
    <ScrollProvider
      onBeginDrag={onBeginDrag}
      onEndDrag={onEndDrag}
      onScroll={onScroll}
      onMomentumEnd={onMomentumEnd}>
      {children}
    </ScrollProvider>
  )
}

const emitter = new EventEmitter()

if (IS_WEB) {
  const originalScroll = window.scroll
  window.scroll = function () {
    emitter.emit('forced-scroll')
    return originalScroll.apply(this, arguments as any)
  }

  const originalScrollTo = window.scrollTo
  window.scrollTo = function () {
    emitter.emit('forced-scroll')
    return originalScrollTo.apply(this, arguments as any)
  }
}

function listenToForcedWindowScroll(listener: () => void) {
  emitter.addListener('forced-scroll', listener)
  return () => {
    emitter.removeListener('forced-scroll', listener)
  }
}
