import * as React from 'react'
import {View} from 'react-native'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {Link} from '../util/Link'
import {UserAvatar} from '../util/UserAvatar'

export function PostThreadLoadMore({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()

  const postHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])

  return (
    <Link
      href={postHref}
      style={[a.flex_row, a.align_center, a.px_xl, a.py_md]}
      hoverStyle={[t.atoms.bg_contrast_25]}>
      <UserAvatar avatar={post.author.avatar} size={30} />
      <View style={[a.px_lg]}>
        <Text style={[{color: t.palette.primary_500}, a.text_md]}>
          <Trans>Continue thread...</Trans>
        </Text>
      </View>
    </Link>
  )
}
