import {type AtUriString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {
  optimisticallyDeleteBookmark,
  optimisticallySaveBookmark,
} from '#/state/queries/bookmarks/useBookmarksQuery'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

type MutationArgs =
  | {action: 'create'; post: app.bsky.feed.defs.PostView}
  | {
      action: 'delete'
      /**
       * For deletions, we only need to URI. Plus, in some cases we only know the
       * URI, such as when a post was deleted by the author.
       */
      uri: string
    }

export function useBookmarkMutation() {
  const qc = useQueryClient()
  const client = useAppviewClient()

  return useMutation({
    async mutationFn(args: MutationArgs) {
      if (args.action === 'create') {
        updatePostShadow(qc, args.post.uri, {bookmarked: true})
        await client.call(app.bsky.bookmark.createBookmark, {
          uri: args.post.uri,
          cid: args.post.cid,
        })
      } else if (args.action === 'delete') {
        updatePostShadow(qc, args.uri, {bookmarked: false})
        await client.call(app.bsky.bookmark.deleteBookmark, {
          uri: args.uri as AtUriString,
        })
      }
    },
    onSuccess(_, args) {
      if (args.action === 'create') {
        optimisticallySaveBookmark(qc, args.post)
      } else if (args.action === 'delete') {
        optimisticallyDeleteBookmark(qc, {uri: args.uri})
      }
    },
    onError(e, args) {
      if (args.action === 'create') {
        updatePostShadow(qc, args.post.uri, {bookmarked: false})
      } else if (args.action === 'delete') {
        updatePostShadow(qc, args.uri, {bookmarked: true})
      }

      if (!isNetworkError(e)) {
        logger.error('bookmark mutation failed', {
          bookmarkAction: args.action,
          safeMessage: e,
        })
      }
    },
  })
}
