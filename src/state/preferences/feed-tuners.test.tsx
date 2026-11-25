import {renderHook} from '@testing-library/react-native'

import {FeedTuner} from '#/lib/api/feed-manip'
import {useFeedTuners} from './feed-tuners'

jest.mock('#/lib/api/feed/home', () => ({
  FALLBACK_MARKER_POST: {post: {uri: 'at://did:plc:test/app.bsky.feed.post/1'}},
}))

jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: () => ({data: undefined}),
}))

jest.mock('#/state/session', () => ({
  useSession: () => ({currentAccount: undefined}),
}))

jest.mock('./languages', () => ({
  useLanguagePrefs: () => ({contentLanguages: []}),
}))

describe('Replies feed tuners', () => {
  it.each(['posts_with_replies', 'posts_and_replies_only'] as const)(
    'keeps defensive repost removal for %s on older AppViews',
    filter => {
      const {result} = renderHook(() =>
        useFeedTuners(`author|did:plc:alice|${filter}`),
      )
      expect(result.current).toEqual([FeedTuner.removeReposts])
    },
  )
})
