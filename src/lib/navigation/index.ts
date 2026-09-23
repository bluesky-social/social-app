import {useMemo} from 'react'
import {router, useNavigationContainerRef} from 'expo-router'
import {
  CommonActions,
  type NavigationAction,
  type NavigationContainerRefWithCurrent,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type RouteProp,
  TabActions,
  useNavigation as useRouterNavigation,
  useNavigationState as useRouterNavigationState,
  useRoute as useRouterRoute,
} from 'expo-router/react-navigation'

import {
  getRouteFile,
  getScreenName,
  getScreenParams,
  screenHref,
  type TabGroup,
  tabGroups,
  tabRoots,
} from '#/lib/navigation/routes'
import {type NavigationProp} from '#/lib/routes/types'
import {IS_WEB} from '#/env'
import {router as appLinks} from '#/routes'

export * from 'expo-router/react-navigation'

let rootRef: NavigationContainerRefWithCurrent<ParamListBase> | undefined

/** Share Expo Router's container with notification and account-switch handlers. */
export function useAppNavigationRef() {
  const ref = useNavigationContainerRef()
  rootRef = ref
  return ref
}

export function getActiveGroup(): TabGroup {
  let state = rootRef?.getRootState()
  while (state) {
    const route = state.routes[state.index ?? 0]
    const group = route?.name.match(
      /^\((home|search|messages|notifications|profile)\)$/,
    )?.[1]
    if (group) return group as TabGroup
    state = route?.state as NavigationState | undefined
  }
  return 'home'
}

/** Preserve the current destination when an incoming intent opens an overlay. */
export function getCurrentPath() {
  const route = rootRef?.getCurrentRoute()
  if (!route) return '/(tabs)/(home)'
  const name = getScreenName(route.name)
  const path =
    appLinks.matchName(name)?.build(route.params) ??
    (name === 'MyProfile' ? '/my-profile' : '/')
  return `/(tabs)/(${getActiveGroup()})${path}`
}

export function toAppRoute<T extends {name: string; params?: object}>(
  route: T,
): T {
  const tab = Object.entries(tabGroups).find(
    ([, group]) => route.name === `(${group})`,
  )
  return {
    ...route,
    name: tab?.[0] ?? getScreenName(route.name),
    params: getScreenParams(route.params as Record<string, unknown>),
  }
}

/** Skip layout wrappers shared by the legacy state adapter and reset actions. */
function unwrapState(state: NavigationState): NavigationState {
  const active = state.routes[state.index ?? 0]
  if (
    active?.state &&
    (active.name === '__root' ||
      active.name === '(tabs)' ||
      (IS_WEB && active.name.startsWith('(')))
  ) {
    return unwrapState(active.state as NavigationState)
  }
  return state
}

const stateCache = new WeakMap<NavigationState, NavigationState>()

/** Keep screen identifiers stable for analytics and existing tab-selection UI. */
export function toAppState(state: NavigationState): NavigationState {
  const cached = stateCache.get(state)
  if (cached) return cached
  const unwrapped = unwrapState(state)
  if (unwrapped !== state) return toAppState(unwrapped)
  const result = {
    ...state,
    routeNames: state.routeNames?.map(name => toAppRoute({name}).name),
    routes: state.routes.map(route => ({
      ...toAppRoute(route),
      state: route.state
        ? toAppState(route.state as NavigationState)
        : undefined,
    })),
  }
  stateCache.set(state, result)
  return result
}

export function useRoute<T extends RouteProp<ParamListBase>>(): T {
  const route = useRouterRoute()
  return useMemo(() => toAppRoute(route) as T, [route])
}

export function useNavigationState<T>(
  selector: (state: NavigationState) => T,
): T {
  return useRouterNavigationState(state => selector(toAppState(state)))
}

function selectTab(name: string) {
  const group = tabGroups[name as keyof typeof tabGroups]
  if (!group) return false
  if (IS_WEB) {
    router.navigate(screenHref(getScreenName(tabRoots[group])))
  } else {
    let state = rootRef?.getRootState()
    while (state) {
      if (state.type === 'tab' && state.routeNames.includes(`(${group})`)) {
        // Target the tab navigator beneath Expo Router's root stack.
        rootRef?.dispatch({
          ...TabActions.jumpTo(`(${group})`),
          target: state.key,
        })
        return true
      }
      state = state.routes[state.index ?? 0]?.state as
        NavigationState | undefined
    }
    router.navigate(screenHref(getScreenName(tabRoots[group]), {}, group))
  }
  return true
}

export function navigate(name: string, params?: object) {
  if (!params && selectTab(name)) return Promise.resolve()
  router.navigate(appHref(name, params))
  return Promise.resolve()
}

function appHref(name: string, params?: object) {
  const rootGroup = tabGroups[`${name}Tab` as keyof typeof tabGroups]
  return screenHref(
    name,
    params as Record<string, unknown>,
    IS_WEB ? 'home' : (rootGroup ?? getActiveGroup()),
  )
}

export function resetToTab(name: keyof typeof tabGroups) {
  const group = IS_WEB ? 'home' : tabGroups[name]
  router.dismissTo(
    screenHref(getScreenName(tabRoots[tabGroups[name]]), {}, group),
  )
}

export function reset() {
  if (rootRef?.isReady()) {
    const state = {
      index: 0,
      routes: [
        {
          name: '(tabs)',
          state: {
            routes: [{name: '(home)', state: {routes: [{name: 'index'}]}}],
          },
        },
      ],
    }
    rootRef.resetRoot(
      rootRef.getRootState().routeNames.includes('__root')
        ? {index: 0, routes: [{name: '__root', state}]}
        : state,
    )
  }
  return Promise.resolve()
}

type ResetState = {
  index?: number
  routes: {
    key?: string
    name: string
    params?: object
    state?: ResetState
  }[]
  routeNames?: string[]
}

/** Translate reset destinations without discarding history or changing its index. */
function toRouterState(
  state: ResetState,
  original?: NavigationState | PartialState<NavigationState>,
): ResetState {
  const routeName = (name: string) => {
    const group = tabGroups[name as keyof typeof tabGroups]
    return group ? `(${group})` : getRouteFile(name)
  }
  /*
   * Stack rehydration selects the last route in a partial state, ignoring index.
   * Tab resets remain partial so omitted tabs are restored by the tab router.
   */
  return {
    ...(original?.type === 'stack' ? original : {}),
    ...state,
    ...(original?.type === 'stack' && original.stale === false
      ? {stale: false, index: state.index ?? state.routes.length - 1}
      : {}),
    routeNames: original?.routeNames ?? state.routeNames?.map(routeName),
    routes: state.routes.map(route => {
      const previous = route.key
        ? original?.routes.find(candidate => candidate.key === route.key)
        : undefined
      return {
        ...route,
        name:
          previous && getScreenName(previous.name) === route.name
            ? previous.name
            : routeName(route.name),
        params:
          route.params &&
          Object.fromEntries(
            Object.entries(route.params).map(([key, value]) => [
              key,
              typeof value === 'boolean' ? String(value) : value,
            ]),
          ),
        state: route.state
          ? toRouterState(route.state, previous?.state)
          : undefined,
      }
    }),
  }
}

/** Existing screen actions delegate to Expo Router; focus and gesture events stay native. */
export function useNavigation<T = NavigationProp>(): T {
  const navigation = useRouterNavigation<NavigationProp>()
  return useMemo(() => {
    const href = appHref
    const dispatch = (
      action: NavigationAction | ((state: NavigationState) => NavigationAction),
    ) => {
      if (typeof action === 'function')
        action = action(toAppState(navigation.getState()))
      const payload:
        | {
            name?: string
            params?: object
            routes?: {name: string; params?: object}[]
          }
        | undefined = action.payload
      if (
        payload?.name &&
        ['NAVIGATE', 'PUSH', 'REPLACE', 'POP_TO'].includes(action.type)
      ) {
        if (action.type === 'NAVIGATE')
          void navigate(payload.name, payload.params)
        else if (action.type === 'PUSH')
          router.push(href(payload.name, payload.params))
        else if (action.type === 'REPLACE')
          router.replace(href(payload.name, payload.params))
        else router.dismissTo(href(payload.name, payload.params))
      } else if (action.type === 'RESET' && payload?.routes?.length) {
        const state = unwrapState(navigation.getState())
        const dispatcher = rootRef ?? navigation
        dispatcher.dispatch({
          ...action,
          target: action.target ?? state.key,
          payload: toRouterState({...payload, routes: payload.routes}, state),
        })
      } else {
        navigation.dispatch(action)
      }
    }
    return {
      ...navigation,
      navigate,
      push: (name: string, params?: object) => router.push(href(name, params)),
      replace: (name: string, params?: object) =>
        router.replace(href(name, params)),
      popTo: (name: string, params?: object) =>
        router.dismissTo(href(name, params)),
      pop: (count?: number) => router.dismiss(count),
      popToTop: () => router.dismissAll(),
      goBack: () => router.back(),
      canGoBack: () => router.canGoBack(),
      setParams: (
        params: Record<string, string | number | boolean | undefined>,
      ) =>
        router.setParams(
          Object.fromEntries(
            Object.entries(params).map(([key, value]) => [
              key,
              typeof value === 'boolean' ? String(value) : value,
            ]),
          ),
        ),
      getState: () => toAppState(navigation.getState()),
      dispatch,
      reset: (state: Parameters<typeof navigation.reset>[0]) =>
        dispatch(CommonActions.reset(state)),
    } as T
  }, [navigation])
}
