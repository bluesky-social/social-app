import React, {useCallback, useEffect} from 'react'
import EventEmitter from 'eventemitter3'
import {ScrollProvider} from '#/lib/ScrollContext'
import {NativeScrollEvent} from 'react-native'
import {useSetMinimalShellMode, useMinimalShellMode} from '#/state/shell'
import {useShellLayout} from '#/state/shell/shell-layout'
import {isNative, isWeb} from 'platform/detection'
import {useSharedValue, interpolate} from 'react-native-reanimated'

const WEB_HIDE_SHELL_THRESHOLD = 200

function clamp(num: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(num, min), max)
}

export function MainScrollProvider({children}: {children: React.ReactNode}) {
  const {headerHeight} = useShellLayout()
  const mode = useMinimalShellMode()
  const setMode = useSetMinimalShellMode()
  const startDragOffset = useSharedValue<number | null>(null)
  const startMode = useSharedValue<number | null>(null)
  const didJustRestoreScroll = useSharedValue<boolean>(false)

  useEffect(() => {
    if (isWeb) {
      return listenToForcedWindowScroll(() => {
        startDragOffset.value = null
        startMode.value = null
        didJustRestoreScroll.value = true
      })
    }
  })

  const onBeginDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (isNative) {
        startDragOffset.value = e.contentOffset.y
        startMode.value = mode.value
      }
    },
    [mode, startDragOffset, startMode],
  )

  const onEndDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (isNative) {
        startDragOffset.value = null
        startMode.value = null
        if (e.contentOffset.y < headerHeight.value / 2) {
          // If we're close to the top, show the shell.
          setMode(false)
        } else {
          // Snap to whichever state is the closest.
          setMode(Math.round(mode.value) === 1)
        }
      }
    },
    [startDragOffset, startMode, setMode, mode, headerHeight],
  )

  const onScroll = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (isNative) {
        if (startDragOffset.value === null || startMode.value === null) {
          if (mode.value !== 0 && e.contentOffset.y < headerHeight.value) {
            // If we're close enough to the top, always show the shell.
            // Even if we're not dragging.
            setMode(false)
          }
          return
        }

        // The "mode" value is always between 0 and 1.
        // Figure out how much to move it based on the current dragged distance.
        const dy = e.contentOffset.y - startDragOffset.value
        const dProgress = interpolate(
          dy,
          [-headerHeight.value, headerHeight.value],
          [-1, 1],
        )
        const newValue = clamp(startMode.value + dProgress, 0, 1)
        if (newValue !== mode.value) {
          // Manually adjust the value. This won't be (and shouldn't be) animated.
          mode.value = newValue
        }
      } else {
        if (didJustRestoreScroll.value) {
          didJustRestoreScroll.value = false
          // Don't hide/show navbar based on scroll restoratoin.
          return
        }
        // On the web, we don't try to follow the drag because we don't know when it ends.
        // Instead, show/hide immediately based on whether we're scrolling up or down.
        const dy = e.contentOffset.y - (startDragOffset.value ?? 0)
        startDragOffset.value = e.contentOffset.y

        if (dy < 0 || e.contentOffset.y < WEB_HIDE_SHELL_THRESHOLD) {
          setMode(false)
        } else if (dy > 0) {
          setMode(true)
        }
      }
    },
    [
      headerHeight,
      mode,
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
      onScroll={onScroll}>
      {children}
    </ScrollProvider>
  )
}

const emitter = new EventEmitter()

if (isWeb) {
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
