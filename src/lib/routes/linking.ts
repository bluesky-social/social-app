import {
  getActionFromState as getActionFromStateDefault,
  type LinkingOptions,
} from '@react-navigation/native'

import {buildStateObject, getCurrentRoute} from '#/lib/routes/helpers'
import {
  type RootNavigatorParams,
  type RouteParams,
  type State,
} from '#/lib/routes/types'
import {CHAT_INVITE_CODE_REGEX} from '#/lib/strings/url-helpers'
import {IS_NATIVE} from '#/env'
import {stripWidgetTopicParams} from '#/features/trendingWidget/links'
import {router} from '#/routes'

/**
 * `LINKING` has no `config`, so on its own `getActionFromState` doesn't know
 * that Home is the HomeTab stack's initial route. For the [Home, screen] state
 * that `getStateFromPath` builds for most links, it then resets the whole
 * HomeTab stack, remounting Home and losing its feeds and scroll position.
 * With this, a link opens the screen on top of the existing stack, or on top of
 * Home if the stack hasn't mounted yet. It is defined at module scope so that
 * `getActionFromState` can cache what it derives from it.
 */
const NATIVE_LINK_ACTION_CONFIG = {
  screens: {HomeTab: {initialRouteName: 'Home'}},
}

export const LINKING = {
  // TODO figure out what we are going to use
  // note: `bluesky://` is what is used in app.config.js
  prefixes: ['bsky://', 'bluesky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    const node = getCurrentRoute(state)

    // build the path
    const route = router.matchName(node.name)
    if (typeof route === 'undefined') {
      return '/' // default to home
    }
    return route.build((node.params || {}) as RouteParams)
  },

  getStateFromPath(rawPath: string) {
    // `useIntentHandler` has already logged a click from the widget
    const path = stripWidgetTopicParams(rawPath)
    const [name, params] = router.matchPath(path)

    // Any time we receive a url that starts with `intent/` we want to ignore it here. It will be handled in the
    // intent handler hook. We should check for the trailing slash, because if there isn't one then it isn't a valid
    // intent
    // On web, there is no route state that's created by default, so we should initialize it as the home route. On
    // native, since the home tab and the home screen are defined as initial routes, we don't need to return a state
    // since it will be created by react-navigation.
    if (path.includes('intent/')) {
      if (IS_NATIVE) return
      return buildStateObject('Flat', 'Home', params)
    }

    // Chat invite URLs (`/chat/:code`) are handled by `useIntentHandler`, which
    // opens the GroupChatJoinDialog (or the logged-out join flow). Route the
    // path to Home so the dialog overlays Home instead of NotFound. On native,
    // react-navigation strips the `bluesky://` prefix and passes the path
    // without a leading slash, so normalize before matching.
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    if (CHAT_INVITE_CODE_REGEX.test(normalizedPath.split('?')[0])) {
      if (IS_NATIVE) {
        return buildStateObject('HomeTab', 'Home', params)
      }
      return buildStateObject('Flat', 'Home', params)
    }

    if (IS_NATIVE) {
      if (name === 'Search') {
        return buildStateObject('SearchTab', 'Search', params)
      }
      if (name === 'Notifications') {
        return buildStateObject('NotificationsTab', 'Notifications', params)
      }
      if (name === 'Home') {
        return buildStateObject('HomeTab', 'Home', params)
      }
      if (name === 'Messages') {
        return buildStateObject('MessagesTab', 'Messages', params)
      }
      if (
        name === 'Atmosphere' ||
        name === 'Feeds' ||
        name === 'Lists' ||
        name === 'Bookmarks' ||
        name === 'Settings'
      ) {
        return buildStateObject(`${name}Tab`, name, params)
      }
      // if the path is something else, like a post, profile, or even settings, we need to initialize the home tab as pre-existing state otherwise the back button will not work
      return buildStateObject('HomeTab', name, params, [
        {
          name: 'Home',
          params: {},
        },
      ])
    } else {
      const res = buildStateObject('Flat', name, params)
      return res
    }
  },

  getActionFromState(state, options) {
    return getActionFromStateDefault(
      state,
      IS_NATIVE ? NATIVE_LINK_ACTION_CONFIG : options,
    )
  },
} satisfies LinkingOptions<RootNavigatorParams>

/** Use the same URL-to-action conversion for warm and cold notifications. */
export function getNavigationActionFromPath(path: string) {
  const state = LINKING.getStateFromPath(path)
  return state ? LINKING.getActionFromState(state, undefined) : undefined
}
