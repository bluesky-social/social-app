import {useMutation, useQueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {useAgent} from '#/state/session'

type MutationArgs =
  | {action: 'create'; uri: string; cid: string}
  | {action: 'delete'; uri: string}

export function useBookmarkMutation() {
  const qc = useQueryClient()
  const agent = useAgent()

  return useMutation({
    async mutationFn(args: MutationArgs) {
      if (args.action === 'create') {
        updatePostShadow(qc, args.uri, {bookmarked: true})
        await agent.app.bsky.bookmark.createBookmark({
          uri: args.uri,
          cid: args.cid,
        })
      } else if (args.action === 'delete') {
        updatePostShadow(qc, args.uri, {bookmarked: false})
        await agent.app.bsky.bookmark.deleteBookmark({
          uri: args.uri,
        })
      }
    },
    onError(e, args) {
      if (args.action === 'create') {
        updatePostShadow(qc, args.uri, {bookmarked: false})
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
