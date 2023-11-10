import {useMemo} from 'react'
import {FeedTuner} from '#/lib/api/feed-manip'
import {FeedDescriptor} from '../queries/post-feed'
import {useLanguagePrefs} from './languages'

export function useFeedTuners(feedDesc: FeedDescriptor) {
  const langPrefs = useLanguagePrefs()

  return useMemo(() => {
    if (feedDesc.startsWith('feedgen')) {
      return [
        FeedTuner.dedupReposts,
        FeedTuner.preferredLangOnly(langPrefs.contentLanguages),
      ]
    }
    if (feedDesc.startsWith('list')) {
      return [FeedTuner.dedupReposts]
    }
    if (feedDesc === 'home' || feedDesc === 'following') {
      const feedTuners = []

      if (false /*TODOthis.homeFeed.hideReposts*/) {
        feedTuners.push(FeedTuner.removeReposts)
      } else {
        feedTuners.push(FeedTuner.dedupReposts)
      }

      if (true /*TODOthis.homeFeed.hideReplies*/) {
        feedTuners.push(FeedTuner.removeReplies)
      } /* TODO else {
        feedTuners.push(
          FeedTuner.thresholdRepliesOnly({
            userDid: this.rootStore.session.data?.did || '',
            minLikes: this.homeFeed.hideRepliesByLikeCount,
            followedOnly: !!this.homeFeed.hideRepliesByUnfollowed,
          }),
        )
      }*/

      if (false /*TODOthis.homeFeed.hideQuotePosts*/) {
        feedTuners.push(FeedTuner.removeQuotePosts)
      }

      return feedTuners
    }
    return []
  }, [feedDesc, langPrefs])
}
