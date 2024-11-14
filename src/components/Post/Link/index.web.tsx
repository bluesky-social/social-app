import React from 'react'
import {Pressable} from 'react-native'
import {AtUri} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {useLink} from '#/components/Link'
import {Props} from '#/components/Post/Link/types'
import {useReadablePostLabel} from '#/components/Post/Link/util'

export function Link({children, post, reason, ...props}: Props) {
  const href = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const {onPress} = useLink({
    to: href,
    displayText: '',
    disableMismatchWarning: true,
  })
  const label = useReadablePostLabel({post, reason})

  console.log({post, reason, label})

  return (
    <Pressable
      {...props}
      role="article"
      accessibilityRole="link"
      accessibilityHint=""
      accessibilityLabel={label}
      accessible
      onPress={e => {
        props.onPress?.(e)
        onPress(e)
      }}>
      {children}
    </Pressable>
  )
}
