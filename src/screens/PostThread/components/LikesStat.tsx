import {AtUri} from '@atproto/syntax'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'

/**
 * The plain "N likes" stat for the expanded anchor post, linking to the likes
 * list. Renders nothing when the post has no likes.
 */
export function LikesStat({post}: {post: app.bsky.feed.defs.PostView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const formatPostStatCount = useFormatPostStatCount()
  const ax = useAnalytics()

  const likeCount = post.likeCount ?? 0
  if (likeCount === 0) return null

  const urip = new AtUri(post.uri)
  const likesHref = makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')

  return (
    <Link
      to={likesHref}
      label={l`Likes on this post`}
      onPress={() => ax.metric('post:likedBy:click', {})}>
      <Text
        testID="likeCount-expanded"
        style={[a.text_sm, t.atoms.text_contrast_high]}>
        <Trans comment="Like count display, the <0> tags enclose the number of likes in bold (will never be 0)">
          <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
            {formatPostStatCount(likeCount)}
          </Text>{' '}
          <Plural value={likeCount} one="like" other="likes" />
        </Trans>
      </Text>
    </Link>
  )
}
