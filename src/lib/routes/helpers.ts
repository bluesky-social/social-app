import {State, RouteParams} from './types'

export function getCurrentRoute(state: State) {
  let node = state.routes[state.index || 0]
  while (node.state?.routes && typeof node.state?.index === 'number') {
    node = node.state?.routes[node.state?.index]
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
  return (
    isTab(currentRoute.name, 'Home') ||
    isTab(currentRoute.name, 'Search') ||
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

export function buildStateObject(
  stack: string,
  route: string,
  params: RouteParams,
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
          routes: [{name: route, params}],
        },
      },
    ],
  }
}
