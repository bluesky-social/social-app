import {State, NavigationProp} from './types'

// TODO needed?
// export function getCurrentTabName(
//   navigator: NavigationProp | undefined,
// ): string {
//   if (!navigator) {
//     throw new Error('Failed to get current tab')
//   }
//   const state = navigator.getState()
//   if (state.type !== 'tab') {
//     return getCurrentTabName(navigator.getParent())
//   }
//   return state.routes[state.index].name
// }

export function getCurrentRoute(state: State) {
  let node = state.routes[state.index]
  while (node.state?.routes && typeof node.state?.index === 'number') {
    node = node.state?.routes[node.state?.index]
  }
  return node
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
