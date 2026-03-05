import React from 'react'
import {Plural, Trans} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostQuery} from '#/state/queries/post'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostRepostedBy as PostRepostedByComponent} from '#/view/com/post-thread/PostRepostedBy'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostRepostedBy'>
export const PostRepostedByScreen = ({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const setMinimalShellMode = useSetMinimalShellMode()
  const {data: post} = usePostQuery(uri)

  let quoteCount
  if (post) {
    quoteCount = post.repostCount
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
                <Trans>Reposted By</Trans>
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                <Plural
                  value={quoteCount ?? 0}
                  one="# repost"
                  other="# reposts"
                />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <PostRepostedByComponent uri={uri} />
    </Layout.Screen>
  )
}
