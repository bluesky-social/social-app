import {createContext, useContext, useEffect, useRef, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useAnalytics} from '#/analytics'
import {
  type AtmosphereContentMetricContext,
  type AtmosphereMetricContext,
  type AtmosphereSurface,
} from './types'
import {useIsVisible} from './visibility'
import {MIN_VISIBLE_MS} from './visibility/shared'

/**
 * Impressions count once per visit. Start a new one each time the tab or
 * screen comes into view.
 */
export type Visit = {seen: Set<string>}

export function createVisit(): Visit {
  return {seen: new Set()}
}

type Scope = AtmosphereMetricContext & {
  /**
   * Whether the scope is in view: its screen focused, the app in the
   * foreground, and its tab, if any, selected. Impressions only count then.
   */
  isActive: boolean
  visit: Visit
}

type Item = Omit<AtmosphereContentMetricContext, keyof AtmosphereMetricContext>

const ScopeContext = createContext<Scope | null>(null)
ScopeContext.displayName = 'AtmosphereMetricsScopeContext'
const ItemContext = createContext<Item | null>(null)
ItemContext.displayName = 'AtmosphereMetricsItemContext'

/**
 * Turns on Atmosphere metrics for its children. Shared components, like the
 * card menu, also render in post embeds, and log nothing outside a scope.
 */
export function AtmosphereMetricsScope({
  children,
  ...scope
}: Scope & {children: React.ReactNode}) {
  return <ScopeContext value={scope}>{children}</ScopeContext>
}

/** The tab and surface to log, or undefined outside Atmosphere. */
export function useAtmosphereMetricContext() {
  const scope = useContext(ScopeContext)
  return scope ? {tab: scope.tab, surface: scope.surface} : undefined
}

/** Logs a press of the content card it's rendered in, if any. */
export function useLogContentPress() {
  const ax = useAnalytics()
  const scope = useContext(ScopeContext)
  const item = useContext(ItemContext)
  return (target: 'external' | 'photoDialog') => {
    if (!scope || !item) return
    ax.metric('atmosphere:content:press', {
      tab: scope.tab,
      surface: scope.surface,
      ...item,
      target,
    })
  }
}

/**
 * What the Atmosphere metrics providers above hold. Dialogs render in a
 * portal on web, outside those providers, so they take this from where
 * they're opened and pass it to `AtmosphereMetricsRestore`.
 */
export type AtmosphereMetricsSnapshot = {
  scope: Scope | null
  item: Item | null
}

export function useAtmosphereMetricsSnapshot(): AtmosphereMetricsSnapshot {
  return {scope: useContext(ScopeContext), item: useContext(ItemContext)}
}

/** Restores a snapshot inside a dialog, as the given surface. */
export function AtmosphereMetricsRestore({
  snapshot: {scope, item},
  surface,
  children,
}: {
  snapshot: AtmosphereMetricsSnapshot
  surface: AtmosphereSurface
  children: React.ReactNode
}) {
  return (
    <ScopeContext value={scope && {...scope, surface}}>
      <ItemContext value={item}>{children}</ItemContext>
    </ScopeContext>
  )
}

/**
 * Wraps a content card: logs its impression, and gives the card's own
 * events (presses, its menu, its dialog) what to report. Put it inside any
 * moderation mask, so a masked card isn't counted as seen.
 */
export function AtmosphereContentItem({
  style,
  children,
  ...item
}: Item & {style?: StyleProp<ViewStyle>; children: React.ReactNode}) {
  const ax = useAnalytics()
  const scope = useContext(ScopeContext)
  const ref = useRef<React.ComponentRef<typeof View>>(null)
  useImpression(
    ref,
    `${item.section ?? ''}:${item.contentType}:${item.contentId}`,
    () => {
      if (!scope) return
      ax.metric('atmosphere:content:impression', {
        tab: scope.tab,
        surface: scope.surface,
        ...item,
      })
    },
  )
  return (
    <ItemContext value={item}>
      <View ref={ref} style={style}>
        {children}
      </View>
    </ItemContext>
  )
}

/**
 * Calls `onImpression` once `ref` has stayed mostly visible for
 * `MIN_VISIBLE_MS` while the scope is in view, at most once per `key` per
 * visit.
 */
function useImpression(
  ref: React.RefObject<React.ComponentRef<typeof View> | null>,
  key: string,
  onImpression: () => void,
) {
  const scope = useContext(ScopeContext)
  const visit = scope?.visit
  // Re-renders once logged, to stop watching
  const [loggedVisit, setLoggedVisit] = useState<Visit>()
  const isVisible = useIsVisible(
    ref,
    !!scope?.isActive &&
      !!visit &&
      visit !== loggedVisit &&
      !visit.seen.has(key),
  )
  const log = useNonReactiveCallback(onImpression)
  useEffect(() => {
    if (!isVisible || !visit) return
    const timeout = setTimeout(() => {
      setLoggedVisit(visit)
      // Another mount of the same card may have logged it this visit
      if (visit.seen.has(key)) return
      visit.seen.add(key)
      log()
    }, MIN_VISIBLE_MS)
    return () => clearTimeout(timeout)
  }, [isVisible, visit, key, log])
}
