import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import * as Toast from '#/components/Toast'
import {app, type com} from '#/lexicons'
import {updatePostShadow} from '../cache/post-shadow'
import {useAppviewClient, useSession} from '../session'
import {useProfileUpdateMutation} from './profile'

/**
 * Out of the hook because React Compiler cannot lower a `throw` inside a `try`.
 * Keeping the check in place - rather than hoisting it above the `try` - means
 * the catch below still shows its toast and reverts the optimistic update.
 */
function assertSignedIn(account: unknown): asserts account {
  if (!account) throw new Error('Not signed in')
}

/**
 * Out of the hook because React Compiler cannot lower an optional chain inside a
 * `try` block, and `profile` only exists once the request inside it resolves.
 */
function getPinnedPostUri(profile: {
  pinnedPost?: {uri: string}
}): string | undefined {
  return profile.pinnedPost?.uri
}

export function usePinnedPostMutation() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const client = useAppviewClient()
  const queryClient = useQueryClient()
  const {mutateAsync: profileUpdateMutate} = useProfileUpdateMutation()

  return useMutation({
    mutationFn: async ({
      postUri,
      postCid,
      action,
    }: {
      postUri: string
      postCid: string
      action: 'pin' | 'unpin'
    }) => {
      const pinCurrentPost = action === 'pin'
      let prevPinnedPost: string | undefined
      try {
        updatePostShadow(queryClient, postUri, {pinned: pinCurrentPost})

        // get the currently pinned post so we can optimistically remove the pin from it
        assertSignedIn(currentAccount)
        const profile = await client.call(app.bsky.actor.getProfile, {
          actor: currentAccount.did,
        })
        prevPinnedPost = getPinnedPostUri(profile)
        if (prevPinnedPost) {
          /*
           * Nested rather than `&&`: React Compiler cannot lower a logical
           * expression in a test position inside a `try`.
           */
          if (prevPinnedPost !== postUri) {
            updatePostShadow(queryClient, prevPinnedPost, {pinned: false})
          }
        }

        await profileUpdateMutate({
          profile,
          updates: existing => {
            existing.pinnedPost = pinCurrentPost
              ? // the mutation takes the uri/cid as plain strings
                ({
                  uri: postUri,
                  cid: postCid,
                } as com.atproto.repo.strongRef.Main)
              : undefined
            return existing
          },
          checkCommitted: profile => {
            if (!profile) return false
            return pinCurrentPost
              ? profile.pinnedPost?.uri === postUri
              : !profile.pinnedPost
          },
        })

        if (pinCurrentPost) {
          Toast.show(_(msg({message: 'Post pinned', context: 'toast'})))
        } else {
          Toast.show(_(msg({message: 'Post unpinned', context: 'toast'})))
        }

        queryClient.invalidateQueries({
          queryKey: FEED_RQKEY(
            `author|${currentAccount.did}|posts_and_author_threads`,
          ),
        })
        queryClient.invalidateQueries({
          queryKey: FEED_RQKEY(
            `author|${currentAccount.did}|posts_with_replies`,
          ),
        })
      } catch (e: any) {
        Toast.show(_(msg`Failed to pin post`))
        logger.error('Failed to pin post', {message: String(e)})
        // revert optimistic update
        updatePostShadow(queryClient, postUri, {
          pinned: !pinCurrentPost,
        })
        if (prevPinnedPost && prevPinnedPost !== postUri) {
          updatePostShadow(queryClient, prevPinnedPost, {pinned: true})
        }
      }
    },
  })
}
