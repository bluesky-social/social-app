import {type Href} from 'expo-router'

import {routeConfig} from '#/lib/navigation/routeConfig'

export const tabGroups = {
  HomeTab: 'home',
  SearchTab: 'search',
  MessagesTab: 'messages',
  NotificationsTab: 'notifications',
  MyProfileTab: 'profile',
} as const

export const tabRoots = {
  home: 'index',
  search: 'search',
  messages: 'messages',
  notifications: 'notifications',
  profile: 'my-profile',
} as const

export type TabGroup = keyof typeof tabRoots

export function getScreenName(file: string) {
  return routeConfig[file as keyof typeof routeConfig]?.name ?? file
}

export function getRouteFile(name: string) {
  const entry = Object.entries(routeConfig).find(
    ([, value]) => value.name === name,
  )
  if (!entry) throw new Error(`Unknown screen: ${name}`)
  return entry[0]
}

/** Normalize URL scalars at the boundary for existing screen components. */
export function getScreenParams(params?: Record<string, unknown>) {
  const result = {...params}
  for (const key of [
    'hideBackButton',
    'fromDialog',
    'new',
    'accept',
    'pushToNewGroupChat',
  ]) {
    if (key in result)
      result[key] = result[key] === true || result[key] === 'true'
  }
  return result
}

/** Resolve named app links to the file route in the active native tab. */
export function screenHref(
  name: string,
  params: Record<string, unknown> = {},
  group: TabGroup = 'home',
): Href {
  const tab = tabGroups[name as keyof typeof tabGroups]
  if (tab) {
    if (typeof params.screen === 'string') {
      return screenHref(
        params.screen,
        (params.params ?? {}) as Record<string, unknown>,
        tab,
      )
    }
    return screenHref(getScreenName(tabRoots[tab]), {}, tab)
  }
  const file = getRouteFile(name)
  const serialized: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error(`Route parameter ${key} must be serializable`)
    }
    serialized[key] = String(value)
  }
  const pathname = file === 'index' ? '' : file.replace(/\/index$/, '')
  return {pathname: `/(tabs)/(${group})/${pathname}`, params: serialized}
}
