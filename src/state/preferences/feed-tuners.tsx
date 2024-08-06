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
      return [FeedTuner.preferredLangOnly(langPrefs.contentLanguages)]
    }
    if (feedDesc.startsWith('list')) {
      let feedTuners = []
      if (feedDesc.endsWith('|as_following')) {
        // Same as Following tuners below, copypaste for now.
        feedTuners.push(FeedTuner.removeOrphans)
        if (preferences?.feedViewPrefs.hideReposts) {
          feedTuners.push(FeedTuner.removeReposts)
        }
        if (preferences?.feedViewPrefs.hideReplies) {
          feedTuners.push(FeedTuner.removeReplies)
        } else {
          feedTuners.push(
            FeedTuner.followedRepliesOnly({
              userDid: currentAccount?.did || '',
            }),
          )
        }
        if (preferences?.feedViewPrefs.hideQuotePosts) {
          feedTuners.push(FeedTuner.removeQuotePosts)
        }
        feedTuners.push(FeedTuner.dedupThreads)
      }
      return feedTuners
    }
    if (feedDesc === 'following') {
      const feedTuners = [FeedTuner.removeOrphans]

      if (preferences?.feedViewPrefs.hideReposts) {
        feedTuners.push(FeedTuner.removeReposts)
      }
      if (preferences?.feedViewPrefs.hideReplies) {
        feedTuners.push(FeedTuner.removeReplies)
      } else {
        feedTuners.push(
          FeedTuner.followedRepliesOnly({
            userDid: currentAccount?.did || '',
          }),
        )
      }
      if (preferences?.feedViewPrefs.hideQuotePosts) {
        feedTuners.push(FeedTuner.removeQuotePosts)
      }
      feedTuners.push(FeedTuner.dedupThreads)

      return feedTuners
    }
    return []
  }, [feedDesc, currentAccount, preferences, langPrefs])
}
