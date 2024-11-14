import React from 'react'
import {AppBskyEmbedImages, AppBskyFeedDefs} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useSession} from '#/state/session'
import {Props} from '#/components/Post/Link/types'

export function useReadablePostLabel({
  post,
  reason,
}: {
  post: AppBskyFeedDefs.PostView
  reason: Props['reason']
}) {
  const {_} = useLingui()
  const getTimeAgo = useGetTimeAgo()
  const {currentAccount} = useSession()

  return React.useMemo(() => {
    const record = post.record as any
    const embed = record.embed
    const ago = getTimeAgo(post.indexedAt, new Date(), {format: 'long'})
    const images = AppBskyEmbedImages.isMain(embed) ? embed.images : []

    const isMe = currentAccount?.did === post.author.did

    const repostLede = AppBskyFeedDefs.isReasonRepost(reason)
      ? isMe
        ? msg({
            message: `You re-posted`,
            comment: `Used for screen readers, heard when a post is focused by the user.`,
          })
        : msg({
            message: `${sanitizeDisplayName(
              reason.by.displayName || reason.by.handle,
            )} re-posted`,
            comment: `Used for screen readers, heard when a post is focused by the user.`,
          })
      : ``

    return _(msg`
      ${repostLede}

      ${sanitizeDisplayName(post.author.displayName || post.author.handle)}:

      ${record.text}.

      ${
        images.length > 0
          ? images
              .map((img, i) => {
                return `Image ${i + 1} of ${images.length}: ${
                  img.alt ?? `no alt text available.`
                }`
              })
              .join('. ')
          : ''
      }

      ${ago} ago.

      ${plural(post.replyCount || 0, {
        one: '1 reply',
        other: '# replies',
      })}
      ${plural(post.repostCount || 0, {
        one: '1 repost',
        other: '# reposts',
      })}
      ${plural(post.quoteCount || 0, {
        one: '1 quote post',
        other: '# quote posts',
      })}
    `)
  }, [_, getTimeAgo, post, reason, currentAccount])
}
