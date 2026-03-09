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
    return {name: 'Home'}
  }

  let node = state.routes[state.index || 0]
  while (node.state?.routes && typeof node.state?.index === 'number') {
    node = node.state?.routes[node.state?.index]
  }
  return node
}

export function isStateAtTabRoot(state: State | undefined) {
  if (!state) {
    // During initialization (before navigation state is set), default to
    // not-at-root. This prevents the drawer gesture from activating during
    // the async window before the initial URL is resolved, which would
    // compete with the native stack's back gesture on deep link opens.
    return false
  }
  const currentRoute = getCurrentRoute(state)
  return (
    isTab(currentRoute.name, 'Home') ||
    isTab(currentRoute.name, 'Search') ||
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

export enum TabState {
  InsideAtRoot,
  Inside,
  Outside,
}
export function getTabState(state: State | undefined, tab: string): TabState {
  if (!state) {
    return TabState.Outside
  }
  const currentRoute = getCurrentRoute(state)
  if (isTab(currentRoute.name, tab)) {
    return TabState.InsideAtRoot
  } else if (isTab(state.routes[state.index || 0].name, tab)) {
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
      routes: [{name: route, params}],
    }
  }
  return {
    routes: [
      {
        name: stack,
        state: {
          routes: [...state, {name: route, params}],
        },
      },
    ],
  }
}
