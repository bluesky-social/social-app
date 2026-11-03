import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render} from '@testing-library/react-native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {PostLikedByScreen} from '#/screens/Post/PostLikedBy'
import {PostQuotesScreen} from '#/screens/Post/PostQuotes'
import {PostRepostedByScreen} from '#/screens/Post/PostRepostedBy'
import {type app} from '#/lexicons'

const DID = 'did:plc:7r7oxqovttrrcgzsy24ogise'
const RKEY = '3mzcxu73eg22h'
const URI = `at://${DID}/app.bsky.feed.post/${RKEY}`

const mockSetOptions = jest.fn()
let mockPost: app.bsky.feed.defs.PostView | undefined

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({setOptions: mockSetOptions}),
}))
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

function postBy(handle: string) {
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
  } as app.bsky.feed.defs.PostView
}

type PostRouteName = 'PostLikedBy' | 'PostRepostedBy' | 'PostQuotes'
type PostScreenProps<Name extends PostRouteName> = NativeStackScreenProps<
  CommonNavigatorParams,
  Name
>

function renderScreen<Name extends PostRouteName>(
  Screen: React.ComponentType<PostScreenProps<Name>>,
) {
  // The screens read only route.params; navigation is the mocked hook.
  const props = {
    route: {params: {name: DID, rkey: RKEY}},
  } as unknown as PostScreenProps<Name>
  return render(
    <I18nProvider i18n={i18n}>
      <Screen {...props} />
    </I18nProvider>,
  )
}

beforeAll(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

beforeEach(() => {
  mockSetOptions.mockClear()
  mockPost = postBy('ironeconomist.bsky.social')
})

describe("post screens' document title", () => {
  it("titles DID-addressed liked-by with the author's handle", () => {
    renderScreen(PostLikedByScreen)
    expect(mockSetOptions).toHaveBeenLastCalledWith({
      title: 'Post by @ironeconomist.bsky.social — Bluesky',
    })
  })

  it("titles DID-addressed reposted-by with the author's handle", () => {
    renderScreen(PostRepostedByScreen)
    expect(mockSetOptions).toHaveBeenLastCalledWith({
      title: 'Post by @ironeconomist.bsky.social — Bluesky',
    })
  })

  it("titles DID-addressed quotes with the author's handle", () => {
    renderScreen(PostQuotesScreen)
    expect(mockSetOptions).toHaveBeenLastCalledWith({
      title: 'Post by @ironeconomist.bsky.social — Bluesky',
    })
  })
})
