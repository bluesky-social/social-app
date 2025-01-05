import {useCallback} from 'react'
import {AppBskyFeedDefs, ComAtprotoRepoPutRecord} from '@atproto/api'
import {TID} from '@atproto/common'
import {useMutation} from '@tanstack/react-query'

import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {LogEvents} from '#/lib/statsig/events'
import {logEvent} from '#/lib/statsig/statsig'
import {Shadow} from '../cache/types'
import {useAgent} from '../session'

export function usePostBookmarkMutationQueue(
  post: Shadow<AppBskyFeedDefs.PostView>,
  logContext: LogEvents['post:bookmark']['logContext'],
) {
  const bookmarkUri = 'someuri'
  const bookmarkMutation = usePostBookmarkMutation(logContext, post)

  const queueToggle = useToggleMutationQueue({
    initialState: bookmarkUri,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runMutation: async (prev, shouldBookmark = true) => {
      const {data, success} = await bookmarkMutation.mutateAsync()
      if (!success) {
        throw new Error('Failed to toggle bookmark')
      }
      return data.uri
    },
    onSuccess(finalBookmarkUri) {
      console.log('onSuccess', finalBookmarkUri)
    },
  })

  const queueBookmark = useCallback(() => {
    return queueToggle(true)
  }, [queueToggle])
  return [queueBookmark]
}

function usePostBookmarkMutation(
  logContext: LogEvents['post:bookmark']['logContext'],
  post: Shadow<AppBskyFeedDefs.PostView>,
) {
  const agent = useAgent()
  return useMutation<ComAtprotoRepoPutRecord.Response, Error>({
    mutationFn: () => {
      logEvent('post:bookmark', {
        logContext,
      })

      const rkey = TID.nextStr()
      const record = {
        $type: 'community.lexicon.bookmarks.bookmark',
        subject: post.uri,
        createdAt: new Date().toISOString(),
      }
      return agent.com.atproto.repo.putRecord({
        repo: agent.assertDid,
        collection: 'community.lexicon.bookmarks.bookmark',
        rkey,
        record,
        validate: false,
      })
    },
  })
}
