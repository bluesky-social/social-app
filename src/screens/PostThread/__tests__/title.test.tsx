import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render} from '@testing-library/react-native'

import {type ThreadItem} from '#/state/queries/usePostThread'
import {PostThread} from '#/screens/PostThread'

const DID = 'did:plc:7r7oxqovttrrcgzsy24ogise'
const URI = `at://${DID}/app.bsky.feed.post/3mzcxu73eg22h`

const mockSetOptions = jest.fn()
let mockItems: ThreadItem[] = []

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {View: 'View'},
  useAnimatedStyle: () => ({}),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({setOptions: mockSetOptions}),
}))
jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: () => undefined,
}))
jest.mock('#/state/queries/usePostThread', () => ({
  PostThreadContextProvider: ({children}: {children: React.ReactNode}) =>
    children,
  usePostThread: () => ({
    data: {items: mockItems, threadgate: undefined},
    state: {
      error: undefined,
      isFetching: false,
      isPlaceholderData: false,
      otherItemsVisible: false,
      sort: 'hotness',
      view: 'linear',
    },
    actions: {
      insertReplies: jest.fn(),
      refetch: jest.fn(),
      setSort: jest.fn(),
      setView: jest.fn(),
    },
  }),
}))
jest.mock('#/state/session', () => ({useSession: () => ({hasSession: false})}))
jest.mock('#/state/unstable-post-source', () => ({
  useUnstablePostSource: () => undefined,
}))
jest.mock('#/state/feed-feedback', () => ({
  FeedFeedbackProvider: ({children}: {children: React.ReactNode}) => children,
  useFeedFeedback: () => ({
    feedDescriptor: undefined,
    sendInteraction: jest.fn(),
  }),
}))
jest.mock('#/state/shell/shell-layout', () => ({useShellLayout: () => ({})}))
jest.mock('#/lib/hooks/useInitialNumToRender', () => ({
  useInitialNumToRender: () => 10,
}))
jest.mock('#/lib/hooks/useOpenComposer', () => ({
  useOpenComposer: () => ({openComposer: jest.fn()}),
}))
jest.mock('#/lib/hooks/usePostViewTracking', () => ({
  usePostViewTracking: () => jest.fn(),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  native: () => ({}),
  web: () => ({}),
  platform: (specifics: {default?: unknown}) => specifics.default,
  useBreakpoints: () => ({gtMobile: true}),
}))
jest.mock('#/components/Layout', () => {
  const Passthrough = ({children}: {children?: React.ReactNode}) =>
    children ?? null
  return {
    Header: {
      Outer: Passthrough,
      BackButton: () => null,
      Content: Passthrough,
      TitleText: Passthrough,
      Slot: Passthrough,
    },
  }
})
jest.mock('#/components/Lists', () => ({ListFooter: () => null}))
jest.mock('#/view/com/util/List', () => ({List: () => null}))
// Thread rows render inside the stubbed List, so only their imports matter.
jest.mock('#/screens/PostThread/components/HeaderDropdown', () => ({
  HeaderDropdown: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadComposePrompt', () => ({
  ThreadComposePrompt: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadError', () => ({
  ThreadError: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadItemAnchor', () => ({
  ThreadItemAnchor: () => null,
  ThreadItemAnchorSkeleton: () => null,
}))
jest.mock(
  '#/screens/PostThread/components/ThreadItemAnchorNoUnauthenticated',
  () => ({ThreadItemAnchorNoUnauthenticated: () => null}),
)
jest.mock('#/screens/PostThread/components/ThreadItemPost', () => ({
  ThreadItemPost: () => null,
  ThreadItemPostSkeleton: () => null,
}))
jest.mock(
  '#/screens/PostThread/components/ThreadItemPostNoUnauthenticated',
  () => ({ThreadItemPostNoUnauthenticated: () => null}),
)
jest.mock('#/screens/PostThread/components/ThreadItemPostTombstone', () => ({
  ThreadItemPostTombstone: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadItemReadMore', () => ({
  ThreadItemReadMore: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadItemReadMoreUp', () => ({
  ThreadItemReadMoreUp: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadItemReplyComposer', () => ({
  ThreadItemReplyComposerSkeleton: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadItemShowOtherReplies', () => ({
  ThreadItemShowOtherReplies: () => null,
}))
jest.mock('#/screens/PostThread/components/ThreadItemTreePost', () => ({
  ThreadItemTreePost: () => null,
  ThreadItemTreePostSkeleton: () => null,
}))

function threadPost(handle: string): ThreadItem {
  return {
    type: 'threadPost',
    key: URI,
    uri: URI,
    depth: 0,
    value: {
      post: {
        uri: URI,
        cid: 'bafyreih',
        author: {did: DID, handle},
        record: {
          $type: 'app.bsky.feed.post',
          text: 'Ireland is such good evidence',
          createdAt: '2026-11-02T09:06:10.071Z',
        },
        indexedAt: '2026-11-02T09:06:10.071Z',
      },
    },
  } as ThreadItem
}

function renderThread() {
  return render(
    <I18nProvider i18n={i18n}>
      <PostThread uri={URI} />
    </I18nProvider>,
  )
}

beforeAll(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

beforeEach(() => {
  mockSetOptions.mockClear()
  mockItems = []
})

describe('PostThread document title', () => {
  it("titles a DID-addressed post with its author's handle", () => {
    mockItems = [threadPost('ironeconomist.bsky.social')]
    renderThread()
    expect(mockSetOptions).toHaveBeenLastCalledWith({
      title: 'Post by @ironeconomist.bsky.social — Bluesky',
    })
  })
})
