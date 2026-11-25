import {useEffect, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'

import {onAppStateChange} from '#/lib/appState'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type AtmosphereTab} from '#/screens/Atmosphere/metrics/types'
import {createTabTaps} from '#/screens/Notifications/tabTaps'
import {useAnalytics} from '#/analytics'
import {type Metrics} from '#/analytics/metrics'

/**
 * Logs `atmosphere:tab:displayed` and `atmosphere:tab:duration` for the
 * Atmosphere pager. Wire the returned handlers to the pager. Also returns the tab in view and whether it's showing, for the tabs'
 * metrics scopes.
 */
export function useTabMetrics(tabs: readonly AtmosphereTab[]) {
  const ax = useAnalytics()
  const page = useRef(0)
  const isFocused = useRef(false)
  const isForeground = useRef(AppState.currentState !== 'background')
  /** When the tab in view came into view, while it's still in view. */
  const shownAt = useRef<number | undefined>(undefined)
  const [tabTaps] = useState(createTabTaps)
  const [view, setView] = useState<{
    page: number
    isShowing: boolean
  }>({page: 0, isShowing: false})

  const startShowing = () => {
    if (!isFocused.current || !isForeground.current) return
    if (shownAt.current !== undefined) return
    shownAt.current = Date.now()
    setView(prev => ({...prev, isShowing: true}))
  }
  const stopShowing = (endReason: 'switched' | 'blurred' | 'backgrounded') => {
    if (shownAt.current === undefined) return
    ax.metric('atmosphere:tab:duration', {
      tab: tabs[page.current],
      durationMs: Date.now() - shownAt.current,
      endReason,
    })
    shownAt.current = undefined
    setView(prev => ({...prev, isShowing: false}))
  }
  const logDisplayed = (
    payload: Metrics['atmosphere:tab:displayed'],
    index: number,
  ) => {
    ax.metric('atmosphere:tab:displayed', payload)
    setView(prev => ({...prev, page: index}))
  }

  useFocusEffect(
    useNonReactiveCallback(() => {
      isFocused.current = true
      logDisplayed({tab: tabs[page.current], reason: 'focus'}, page.current)
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
    ...view,
    onTabPressed: (index: number) => {
      // Re-pressing the tab in view doesn't switch pages
      if (index !== page.current) tabTaps.tap(index)
    },
    onPageSelected: (index: number) => {
      // Native also reports the page it starts on
      if (index === page.current) return
      const isTap = tabTaps.take(index)
      stopShowing('switched')
      const previousTab = tabs[page.current]
      page.current = index
      logDisplayed(
        {
          tab: tabs[index],
          previousTab,
          reason: isTap ? 'tap' : 'swipe',
        },
        index,
      )
      startShowing()
    },
  }
}
