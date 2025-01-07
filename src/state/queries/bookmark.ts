import {useCallback} from 'react'
import {
  AppBskyFeedDefs,
  AtUri,
  ComAtprotoRepoDeleteRecord,
  ComAtprotoRepoPutRecord,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {LogEvents} from '#/lib/statsig/events'
import {logEvent} from '#/lib/statsig/statsig'
import {Shadow} from '../cache/types'
import {useAgent} from '../session'
import {getBookmarkUri, invalidate, RQKEY} from './my-bookmarks'

export function usePostBookmarkMutationQueue(
  post: Shadow<AppBskyFeedDefs.PostView>,
  logContext: LogEvents['post:bookmark']['logContext'],
) {
  const initialBookmarkUri = getBookmarkUri(post.uri)
  const bookmarkMutation = usePostBookmarkMutation(logContext, post)
  const unBookmarkMutation = usePostUnBookmarkMutation(logContext)
  const queryClient = useQueryClient()

  const queueToggle = useToggleMutationQueue({
    initialState: initialBookmarkUri,
    runMutation: async (prevBookmarkUri, shouldBookmark) => {
      if (shouldBookmark) {
        const {data} = await bookmarkMutation.mutateAsync()
        invalidate(queryClient)
        queryClient.invalidateQueries({queryKey: RQKEY()})
        return data.uri
      } else {
        if (prevBookmarkUri) {
          console.log('unbookmarking', prevBookmarkUri)
          await unBookmarkMutation.mutateAsync({
            bookmarkUri: prevBookmarkUri,
          })
        }
        invalidate(queryClient)
        queryClient.invalidateQueries({queryKey: RQKEY()})
        return undefined
      }
    },
    onSuccess(finalBookmarkUri) {
      console.log('onSuccess', finalBookmarkUri)
    },
  })

  const queueBookmark = useCallback(() => {
    return queueToggle(true)
  }, [queueToggle])

  const unQueueBookmark = useCallback(() => {
    return queueToggle(false)
  }, [queueToggle])
  return [queueBookmark, unQueueBookmark]
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

      const record = {
        $type: 'community.lexicon.bookmarks.bookmark',
        subject: post.uri,
        createdAt: new Date().toISOString(),
      }
      return agent.com.atproto.repo.createRecord({
        repo: agent.assertDid,
        collection: 'community.lexicon.bookmarks.bookmark',
        record,
        validate: false,
      })
    },
  })
}

function usePostUnBookmarkMutation(
  logContext: LogEvents['post:unbookmark']['logContext'],
) {
  const agent = useAgent()
  return useMutation<
    ComAtprotoRepoDeleteRecord.Response,
    Error,
    {bookmarkUri: string}
  >({
    mutationFn: ({bookmarkUri}) => {
      logEvent('post:unbookmark', {logContext})
      console.log('unbookmark', bookmarkUri)
      const bookmarkUrip = new AtUri(bookmarkUri)
      return agent.com.atproto.repo.deleteRecord({
        repo: agent.assertDid,
        collection: 'community.lexicon.bookmarks.bookmark',
        rkey: bookmarkUrip.rkey,
      })
    },
  })
}
