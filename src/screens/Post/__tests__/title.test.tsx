import {type HandleString} from '@atproto/syntax'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {render} from '@testing-library/react-native'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {PostLikedByScreen} from '#/screens/Post/PostLikedBy'
import {PostQuotesScreen} from '#/screens/Post/PostQuotes'
import {PostRepostedByScreen} from '#/screens/Post/PostRepostedBy'
import {type app} from '#/lexicons'

const DID = 'did:plc:7r7oxqovttrrcgzsy24ogise'
const RKEY = '3mzcxu73eg22h'
const URI = `at://${DID}/app.bsky.feed.post/${RKEY}`

let mockPost: app.bsky.feed.defs.PostView | undefined

jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: () => undefined,
}))
jest.mock('#/state/queries/post', () => ({
  usePostQuery: () => ({data: mockPost}),
}))
jest.mock('#/components/Layout', () => {
  const Passthrough = ({children}: {children?: React.ReactNode}) =>
    children ?? null
  return {
    Screen: Passthrough,
    Center: Passthrough,
    Header: {
      Outer: Passthrough,
      BackButton: () => null,
      Content: Passthrough,
      TitleText: Passthrough,
      SubtitleText: Passthrough,
      Slot: Passthrough,
    },
  }
})
jest.mock('#/view/com/post-thread/PostLikedBy', () => ({
  PostLikedBy: () => null,
}))
jest.mock('#/view/com/post-thread/PostRepostedBy', () => ({
  PostRepostedBy: () => null,
}))
jest.mock('#/view/com/post-thread/PostQuotes', () => ({
  PostQuotes: () => null,
}))
jest.mock('#/view/com/pager/Pager', () => ({Pager: () => null}))
jest.mock('#/view/com/pager/TabBar', () => ({TabBar: () => null}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  web: () => ({}),
}))
jest.mock('#/analytics', () => ({
  AnalyticsContext: ({children}: {children: React.ReactNode}) => children,
  useAnalytics: () => ({metric: jest.fn()}),
  utils: {useMeta: () => ({})},
}))

function postBy(handle: HandleString): app.bsky.feed.defs.PostView {
  return {
    uri: URI,
    cid: 'bafyreih',
    author: {did: DID, handle},
    record: {
      $type: 'app.bsky.feed.post',
      text: 'Ireland is such good evidence',
      createdAt: '2026-11-02T09:06:10.071Z',
    },
    indexedAt: '2026-11-02T09:06:10.071Z',
  }
}

const Stack = createNativeStackNavigator<CommonNavigatorParams>()
const PARAMS = {name: DID, rkey: RKEY}
// What the route options in src/Navigation.tsx produce for a DID URL.
const ROUTE_TITLE = `Post by @${DID} — Bluesky`
const HANDLE_TITLE = 'Post by @ironeconomist.bsky.social — Bluesky'

function renderInStack(screen: React.ReactElement) {
  const navigationRef = createNavigationContainerRef<CommonNavigatorParams>()
  render(
    <I18nProvider i18n={i18n}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>{screen}</Stack.Navigator>
      </NavigationContainer>
    </I18nProvider>,
  )
  return navigationRef
}

beforeAll(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

beforeEach(() => {
  mockPost = postBy('ironeconomist.bsky.social')
})

describe("post screens' document title", () => {
  it("titles DID-addressed liked-by with the author's handle", () => {
    const navigation = renderInStack(
      <Stack.Screen
        name="PostLikedBy"
        component={PostLikedByScreen}
        initialParams={PARAMS}
        options={{title: ROUTE_TITLE}}
      />,
    )
    expect(navigation.getCurrentOptions()).toMatchObject({title: HANDLE_TITLE})
  })

  it("titles DID-addressed reposted-by with the author's handle", () => {
    const navigation = renderInStack(
      <Stack.Screen
        name="PostRepostedBy"
        component={PostRepostedByScreen}
        initialParams={PARAMS}
        options={{title: ROUTE_TITLE}}
      />,
    )
    expect(navigation.getCurrentOptions()).toMatchObject({title: HANDLE_TITLE})
  })

  it("titles DID-addressed quotes with the author's handle", () => {
    const navigation = renderInStack(
      <Stack.Screen
        name="PostQuotes"
        component={PostQuotesScreen}
        initialParams={PARAMS}
        options={{title: ROUTE_TITLE}}
      />,
    )
    expect(navigation.getCurrentOptions()).toMatchObject({title: HANDLE_TITLE})
  })
})
