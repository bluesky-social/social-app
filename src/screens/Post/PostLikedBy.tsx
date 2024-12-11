import React from 'react'
import {Plural, Trans} from '@lingui/macro'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostThreadQuery} from '#/state/queries/post-thread'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostLikedBy as PostLikedByComponent} from '#/view/com/post-thread/PostLikedBy'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostLikedBy'>
export const PostLikedByScreen = ({route}: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostThreadQuery(uri)

  let likeCount
  if (post?.thread.type === 'post') {
    likeCount = post.thread.post.likeCount
  }

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

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
