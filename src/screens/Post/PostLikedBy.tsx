import {Plural, Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostQuery} from '#/state/queries/post'
import {PostLikedBy as PostLikedByComponent} from '#/view/com/post-thread/PostLikedBy'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostLikedBy'>
export const PostLikedByScreen = ({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostQuery(uri)

  let likeCount
  if (post) {
    likeCount = post.likeCount
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {post && (
            <>
              <Layout.Header.TitleText>
                <Trans>Liked By</Trans>
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                <Plural value={likeCount ?? 0} one="# like" other="# likes" />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <PostLikedByComponent uri={uri} />
    </Layout.Screen>
  )
}
