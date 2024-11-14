import React from 'react'
import {AtUri} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {Link as InternalLink} from '#/components/Link'
import {Props} from '#/components/Post/Link/types'
import {useReadablePostLabel} from '#/components/Post/Link/util'

export function Link({children, post, reason, ...props}: Props) {
  const href = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const label = useReadablePostLabel({post, reason})

  return (
    <InternalLink {...props} to={href} label={label}>
      {children}
    </InternalLink>
  )
}
