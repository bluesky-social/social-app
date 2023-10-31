import React, {useCallback, useMemo} from 'react'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'

import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {PostThreadModel} from 'state/models/content/post-thread'
import {useFocusEffect} from '@react-navigation/native'
import {PostThreadItemModel} from 'state/models/content/post-thread-item'
import {useEmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {BaseReaderView} from './BaseReaderView'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ReaderView'>

export const ReaderView = observer(function ReaderView({route}: Props) {
  const store = useStores()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const groupPost = useMemo<PostThreadModel>(
    () => new PostThreadModel(store, {uri}),
    [store, uri],
  )

  const userPost = useMemo(
    () => groupPost.thread?.parent as PostThreadItemModel | undefined,
    [groupPost.thread?.parent],
  )

  const embedInfo = useEmbedInfo(userPost?.data.post.embed)

  useFocusEffect(
    useCallback(() => {
      const threadCleanup = groupPost.registerListeners()
      if (!groupPost.hasLoaded && !groupPost.isLoading) {
        groupPost.setup().catch(err => {
          store.log.error('Failed to fetch post', err)
        })
      }
      return () => {
        threadCleanup()
      }
    }, [groupPost, store]),
  )

  return (
    <BaseReaderView
      link={
        embedInfo.type !== 'link' || embedInfo.link?.originalUri === undefined
          ? undefined
          : embedInfo.link
      }
    />
  )
})
