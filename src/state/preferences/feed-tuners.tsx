import {useMemo} from 'react'

import {FeedTuner} from '#/lib/api/feed-manip'
import {FeedDescriptor} from '../queries/post-feed'
import {usePreferencesQuery} from '../queries/preferences'
import {useSession} from '../session'
import {useLanguagePrefs} from './languages'

export function useFeedTuners(feedDesc: FeedDescriptor) {
  const langPrefs = useLanguagePrefs()
  const {data: preferences} = usePreferencesQuery()
  const {currentAccount} = useSession()

  return useMemo(() => {
    if (feedDesc.startsWith('author')) {
      if (feedDesc.endsWith('|posts_with_replies')) {
        // TODO: Do this on the server instead.
        return [FeedTuner.removeReposts]
      }
    }
    if (feedDesc.startsWith('feedgen')) {
      return [
        FeedTuner.dedupReposts,
        FeedTuner.preferredLangOnly(langPrefs.contentLanguages),
      ]
    }
    if (feedDesc.startsWith('list')) {
      const feedTuners = []

      if (feedDesc.endsWith('|as_following')) {
        // Same as Following tuners below, copypaste for now.
        if (preferences?.feedViewPrefs.hideReposts) {
          feedTuners.push(FeedTuner.removeReposts)
        } else {
          feedTuners.push(FeedTuner.dedupReposts)
        }
        if (preferences?.feedViewPrefs.hideReplies) {
          feedTuners.push(FeedTuner.removeReplies)
        } else {
          feedTuners.push(
            FeedTuner.thresholdRepliesOnly({
              userDid: currentAccount?.did || '',
              minLikes: preferences?.feedViewPrefs.hideRepliesByLikeCount || 0,
              followedOnly:
                !!preferences?.feedViewPrefs.hideRepliesByUnfollowed,
            }),
          )
        }
        if (preferences?.feedViewPrefs.hideQuotePosts) {
          feedTuners.push(FeedTuner.removeQuotePosts)
        }
      } else {
        feedTuners.push(FeedTuner.dedupReposts)
      }
      return feedTuners
    }
    if (feedDesc === 'following') {
      const feedTuners = []

      if (preferences?.feedViewPrefs.hideReposts) {
        feedTuners.push(FeedTuner.removeReposts)
      } else {
        feedTuners.push(FeedTuner.dedupReposts)
      }
      if (preferences?.feedViewPrefs.hideReplies) {
        feedTuners.push(FeedTuner.removeReplies)
      } else {
        feedTuners.push(
          FeedTuner.thresholdRepliesOnly({
            userDid: currentAccount?.did || '',
            minLikes: preferences?.feedViewPrefs.hideRepliesByLikeCount || 0,
            followedOnly: !!preferences?.feedViewPrefs.hideRepliesByUnfollowed,
          }),
        )
      }
      if (preferences?.feedViewPrefs.hideQuotePosts) {
        feedTuners.push(FeedTuner.removeQuotePosts)
      }

      return feedTuners
    }
    return []
  }, [feedDesc, currentAccount, preferences, langPrefs])
}
