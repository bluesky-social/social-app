import React from 'react'
import {Plural, Trans} from '@lingui/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useMerticDisabledPref} from '#/state/preferences'
import {usePostThreadQuery} from '#/state/queries/post-thread'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>
export const PostQuotesScreen = ({route}: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostThreadQuery(uri)

  const {currentAccount} = useSession()
  const {quoteMetrics} = useMerticDisabledPref()

  let quoteCount
  if (post?.thread.type === 'post') {
    quoteCount = post.thread.post.quoteCount
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
                <Trans>Quotes</Trans>
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                {quoteMetrics === 'hide-all' ||
                (quoteMetrics === 'hide-own' &&
                  post?.thread.type === 'post' &&
                  post.thread.post.author.did ===
                    currentAccount?.did) ? null : (
                  <Plural
                    value={quoteCount ?? 0}
                    one="# quote"
                    other="# quotes"
                  />
                )}
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <PostQuotesComponent uri={uri} />
    </Layout.Screen>
  )
}
