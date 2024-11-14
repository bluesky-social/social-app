import React from 'react'
import {AtUri} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {makeProfileLink} from '#/lib/routes/links'
import {Link as InternalLink} from '#/components/Link'
import {Props} from '#/components/Post/Link/types'

export function Link({children, post, ...props}: Props) {
  const {_} = useLingui()
  const getTimeAgo = useGetTimeAgo()
  const href = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const label = _(msg`${post.author.handle}:
    ${(post.record as any).text}.
    ${getTimeAgo(post.indexedAt, new Date(), {format: 'long'})} ago.
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

  return (
    <InternalLink {...props} to={href} label={label}>
      {children}
    </InternalLink>
  )
}
