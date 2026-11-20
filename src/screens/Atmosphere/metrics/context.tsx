import {createContext, useContext, useEffect, useRef} from 'react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useAnalytics} from '#/analytics'
import {
  type AtmosphereContentMetricContext,
  type AtmosphereMetricContext,
  type AtmosphereSurface,
} from './types'

type Scope = AtmosphereMetricContext & {
  /**
   * Whether the scope is in view: its screen focused, the app in the
   * foreground, and its tab, if any, selected. Impressions only count then.
   */
  isActive: boolean
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

/**
 * Gives a content card's presses, menu and dialog their attribution. Without
 * an `item` they log nothing.
 */
export function AtmosphereContentItem({
  children,
  item,
}: {
  item: Item | undefined
  children: React.ReactNode
}) {
  return <ItemContext value={item ?? null}>{children}</ItemContext>
}

/**
 * Logs each content item once per mounted list, using List's onItemSeen.
 * Inactive notifications wait until activation, then only count content
 * still eligible in the current data. This is a queue, not a visibility map.
 */
export function useLogContentImpression<T>(
  items: readonly T[],
  getItem: (item: T, position: number) => Item | undefined,
) {
  const ax = useAnalytics()
  const scope = useContext(ScopeContext)
  const seen = useRef(new Set<string>())
  const pending = useRef(new Set<string>())
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const log = useNonReactiveCallback((item: Item) => {
    if (!mounted.current || !scope?.isActive) return
    const key = impressionKey(item)
    pending.current.delete(key)
    if (seen.current.has(key)) return
    seen.current.add(key)
    ax.metric('atmosphere:content:impression', {
      tab: scope.tab,
      surface: scope.surface,
      ...item,
    })
  })

  useEffect(() => {
    if (!scope?.isActive || !pending.current.size) return
    for (const [position, row] of items.entries()) {
      const item = getItem(row, position)
      if (item && pending.current.has(impressionKey(item))) log(item)
    }
    pending.current.clear()
  }, [scope?.isActive, items, getItem, log])

  return useNonReactiveCallback((row: T, position: number | undefined) => {
    // List callbacks can still arrive after unmount or a data replacement.
    if (!mounted.current || !scope) return
    if (position == null || items[position] !== row) return
    const item = getItem(row, position)
    if (!item) return
    if (scope.isActive) {
      log(item)
    } else if (!seen.current.has(impressionKey(item))) {
      pending.current.add(impressionKey(item))
    }
  })
}

function impressionKey(item: Item) {
  return item.uri
}
