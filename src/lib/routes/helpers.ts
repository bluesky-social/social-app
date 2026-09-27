import {type NavigationProp} from '@react-navigation/native'

import {type RouteParams, type State} from './types'

export function getRootNavigation<T extends {}>(
  nav: NavigationProp<T>,
): NavigationProp<T> {
  while (nav.getParent()) {
    nav = nav.getParent()
  }
  return nav
}

export function getCurrentRoute(state?: State) {
  if (!state) {
    return {name: 'Home', params: undefined}
  }

  /*
   * Nested navigator states may still be partial ("stale") right after a cold
   * start from a deep link, in which case `index` is not set yet. React
   * Navigation focuses the last route when it rehydrates such a state, so
   * mirror that here instead of stopping the descent early and misreporting
   * the tab root as the current route (which e.g. re-enabled the drawer
   * swipe gesture on top of a deep-linked screen).
   */
  let node = state.routes[state.index || 0]
  while (node.state?.routes) {
    node = node.state.routes[node.state.index ?? node.state.routes.length - 1]
  }
  return node
}

export function isStateAtTabRoot(state: State | undefined) {
  if (!state) {
    // NOTE
    // if state is not defined it's because init is occurring
    // and therefore we can safely assume we're at root
    // -prf
    return true
  }
  const currentRoute = getCurrentRoute(state)
  const activeTab = state.routes[state.index || 0].name
  const isSecondaryTabRoot =
    (activeTab === 'FeedsTab' && currentRoute.name === 'Feeds') ||
    (activeTab === 'ListsTab' && currentRoute.name === 'Lists') ||
    (activeTab === 'BookmarksTab' && currentRoute.name === 'Bookmarks') ||
    (activeTab === 'SettingsTab' && currentRoute.name === 'Settings')

  return (
    isTab(currentRoute.name, 'Home') ||
    isTab(currentRoute.name, 'Search') ||
    isSecondaryTabRoot ||
    isTab(currentRoute.name, 'Messages') ||
    isTab(currentRoute.name, 'Notifications') ||
    isTab(currentRoute.name, 'MyProfile')
  )
}

export function isTab(current: string, route: string) {
  // NOTE
  // our tab routes can be variously referenced by 3 different names
  // this helper deals with that weirdness
  // -prf
  return (
    current === route ||
    current === `${route}Tab` ||
    current === `${route}Inner`
  )
}

/** The native profile tab root is named `MyProfile` instead of `Profile`. */
export function isCurrentProfileRoute({
  routeName,
  profileName,
  currentHandle,
}: {
  routeName: string
  profileName?: string
  currentHandle?: string
}) {
  return (
    routeName === 'MyProfile' ||
    (routeName === 'Profile' &&
      !!currentHandle &&
      profileName === currentHandle)
  )
}

export enum TabState {
  InsideAtRoot,
  Inside,
  Outside,
}

const SECONDARY_TAB_ROUTES: Record<string, string> = {
  Feeds: 'FeedsTab',
  Lists: 'ListsTab',
  Bookmarks: 'BookmarksTab',
  Settings: 'SettingsTab',
}

export function getTabState(state: State | undefined, tab: string): TabState {
  if (!state) {
    return TabState.Outside
  }

  const currentRoute = getCurrentRoute(state)
  const activeTabRoute = state.routes[state.index || 0].name
  const secondaryTabRoute = SECONDARY_TAB_ROUTES[tab]
  if (secondaryTabRoute) {
    if (activeTabRoute !== secondaryTabRoute) {
      return TabState.Outside
    }
    return currentRoute.name === tab ? TabState.InsideAtRoot : TabState.Inside
  }

  if (isTab(currentRoute.name, tab)) {
    return TabState.InsideAtRoot
  } else if (isTab(activeTabRoute, tab)) {
    return TabState.Inside
  }
  return TabState.Outside
}

type ExistingState = {
  name: string
  params?: RouteParams
}
export function buildStateObject(
  stack: string,
  route: string,
  params: RouteParams,
  state: ExistingState[] = [],
) {
  if (stack === 'Flat') {
    return {
      index: 0,
      routes: [{name: route, params}],
    }
  }
  /*
   * Set `index` explicitly so consumers of this state (e.g. getCurrentRoute)
   * can tell which route is focused before React Navigation has rehydrated
   * the nested navigator state.
   */
  const routes = [...state, {name: route, params}]
  return {
    index: 0,
    routes: [
      {
        name: stack,
        state: {
          index: routes.length - 1,
          routes,
        },
      },
    ],
  }
}
