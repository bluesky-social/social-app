import {createContext, useContext, useEffect, useRef} from 'react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useAnalytics} from '#/analytics'
import {
  type AtmosphereContentMetricContext,
  type AtmosphereMetricContext,
  type AtmosphereSurface,
} from './types'

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

/**
 * The content card to log, or undefined outside an Atmosphere content card.
 */
export function useAtmosphereContentContext() {
  const scope = useContext(ScopeContext)
  const item = useContext(ItemContext)
  return scope && item
    ? {tab: scope.tab, surface: scope.surface, ...item}
    : undefined
}

/** Logs a press of the content card it's rendered in, if any. */
export function useLogContentPress() {
  const ax = useAnalytics()
  const content = useAtmosphereContentContext()
  return (target: 'external' | 'photoDialog') => {
    if (content) ax.metric('atmosphere:content:press', {...content, target})
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

/** Gives a content card's presses, menu and dialog their attribution. */
export function AtmosphereContentItem({
  children,
  ...item
}: Item & {children: React.ReactNode}) {
  return <ItemContext value={item}>{children}</ItemContext>
}

/** Logs a list item seen by the shared List, at most once per visit. */
export function useLogContentImpression() {
  const ax = useAnalytics()
  const scope = useContext(ScopeContext)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return useNonReactiveCallback((item: Item) => {
    // List callbacks can still arrive after the list unmounts.
    if (!mounted.current || !scope?.isActive) return
    const key = `${item.section ?? ''}:${item.contentType}:${item.contentId}`
    if (scope.visit.seen.has(key)) return
    scope.visit.seen.add(key)
    ax.metric('atmosphere:content:impression', {
      tab: scope.tab,
      surface: scope.surface,
      ...item,
    })
  })
}
