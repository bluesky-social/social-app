import {type AtIdentifierString} from '@atproto/syntax'
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

export function usePinnedPostMutation() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const appviewClient = useAppviewClient()
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
        if (!currentAccount) throw new Error('Not signed in')
        const profile = await appviewClient.call(app.bsky.actor.getProfile, {
          actor: currentAccount.did as AtIdentifierString,
        })
        prevPinnedPost = profile.pinnedPost?.uri
        if (prevPinnedPost && prevPinnedPost !== postUri) {
          updatePostShadow(queryClient, prevPinnedPost, {pinned: false})
        }

        await profileUpdateMutate({
          profile,
          updates: existing => {
            existing.pinnedPost = pinCurrentPost
              ? ({
                  uri: postUri,
                  cid: postCid,
                } as com.atproto.repo.strongRef.Main)
              : undefined
            return existing
          },
          checkCommitted: res =>
            pinCurrentPost ? res.pinnedPost?.uri === postUri : !res.pinnedPost,
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
