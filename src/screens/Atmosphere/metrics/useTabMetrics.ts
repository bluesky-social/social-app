import {useEffect, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'

import {onAppStateChange} from '#/lib/appState'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type AtmosphereTab} from '#/screens/Atmosphere/metrics/types'
import {createTabTaps} from '#/screens/Notifications/tabTaps'
import {useAnalytics} from '#/analytics'

/**
 * Logs `atmosphere:tab:displayed` and `atmosphere:tab:duration` for the
 * Atmosphere pager. Wire the returned handlers to the pager, and call
 * `onSeeMoreApps` just before switching pages for Explore's "See more".
 */
export function useTabMetrics(tabs: readonly AtmosphereTab[]) {
  const ax = useAnalytics()
  const page = useRef(0)
  const isFocused = useRef(false)
  const isForeground = useRef(AppState.currentState !== 'background')
  /** When the tab in view came into view, while it's still in view. */
  const shownAt = useRef<number | undefined>(undefined)
  const [tabTaps] = useState(createTabTaps)
  const [seeMoreTaps] = useState(createTabTaps)

  const startShowing = () => {
    if (isFocused.current && isForeground.current) {
      shownAt.current ??= Date.now()
    }
  }
  const stopShowing = (endReason: 'switched' | 'blurred' | 'backgrounded') => {
    if (shownAt.current === undefined) return
    ax.metric('atmosphere:tab:duration', {
      tab: tabs[page.current],
      durationMs: Date.now() - shownAt.current,
      endReason,
    })
    shownAt.current = undefined
  }

  useFocusEffect(
    useNonReactiveCallback(() => {
      isFocused.current = true
      ax.metric('atmosphere:tab:displayed', {
        tab: tabs[page.current],
        reason: 'focus',
      })
      startShowing()
      return () => {
        stopShowing('blurred')
        isFocused.current = false
      }
    }),
  )

  const onAppState = useNonReactiveCallback((state: string) => {
    isForeground.current = state !== 'background'
    if (isForeground.current) {
      startShowing()
    } else {
      stopShowing('backgrounded')
    }
  })
  useEffect(() => {
    const sub = onAppStateChange(onAppState)
    return () => sub.remove()
  }, [onAppState])

  return {
    onTabPressed: (index: number) => {
      // Re-pressing the tab in view doesn't switch pages
      if (index !== page.current) tabTaps.tap(index)
    },
    onSeeMoreApps: (index: number) => seeMoreTaps.tap(index),
    onPageSelected: (index: number) => {
      // Native also reports the page it starts on
      if (index === page.current) return
      // Take both, so neither is left to mislabel a later swipe
      const isSeeMore = seeMoreTaps.take(index)
      const isTap = tabTaps.take(index)
      stopShowing('switched')
      const previousTab = tabs[page.current]
      page.current = index
      ax.metric('atmosphere:tab:displayed', {
        tab: tabs[index],
        previousTab,
        reason: isSeeMore ? 'seeMoreApps' : isTap ? 'tap' : 'swipe',
      })
      startShowing()
    },
  }
}
