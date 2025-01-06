import React, {useEffect, useState} from 'react'
import {
  ActivityIndicator,
  FlatList as RNFlatList,
  RefreshControl,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {ensureValidAtUri} from '@atproto/syntax'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {cloneDeep} from 'lodash'

import {usePalette} from '#/lib/hooks/usePalette'
import {cleanError} from '#/lib/strings/errors'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useMyBookmarksQuery} from '#/state/queries/my-bookmarks'
import {useGetPost} from '#/state/queries/post'
import {atoms as a, useTheme} from '#/alf'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {Text} from '#/components/Typography'
import {Post} from '../post/Post'
import {EmptyState} from '../util/EmptyState'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {List} from '../util/List'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}

const convertAtUriToBlueskyUrl = (subject: string): string | null => {
  try {
    ensureValidAtUri(subject)
    const uriWithoutPrefix = subject.slice(5)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [handle, collection, id] = uriWithoutPrefix.split('/')
    if (collection !== 'app.bsky.feed.post') {
      return null
    }
    return subject
  } catch (error) {
    return null
  }
}

export function MyBookmarks({
  inline,
  style,
  testID,
}: {
  inline?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const pal = usePalette('default')
  const getPost = useGetPost()
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data, isFetching, isFetched, isError, error, refetch} =
    useMyBookmarksQuery()
  const isEmpty = !isFetching && !data?.length

  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      let items: any[] = []
      if (isError && isEmpty) {
        items = items.concat([ERROR_ITEM])
      }
      if ((!isFetched && isFetching) || !moderationOpts) {
        items = items.concat([LOADING])
      } else if (isEmpty) {
        items = items.concat([EMPTY])
      } else {
        const validData = data?.filter(
          d => convertAtUriToBlueskyUrl(d.subject) != null,
        )

        const fetchedPosts = await Promise.all(
          validData!.map(async d => {
            const post = await getPost({uri: d.subject})
            const p = cloneDeep(post)
            p.bookmarkUri = d.uri
            return p
          }),
        )
        console.log('fetchedPosts:', fetchedPosts)
        items = items.concat(fetchedPosts)
      }
      setPosts(items)
    }

    fetchPosts()
  }, [data, isError, isEmpty, isFetched, isFetching, moderationOpts, getPost])

  const emptyText = _(msg`You have no bookmarks.`)

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh bookmarks', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const keyExtractor = (item: any, index: number) => {
    console.log('keyextractor:', item.bookmarkUri, index)
    return item.bookmarkUri ? item.bookmarkUri.toString() : index.toString()
  }

  const renderItemInner = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY) {
        return (
          <View style={[a.flex_1, a.align_center, a.gap_sm, a.px_xl, a.pt_xl]}>
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.rounded_full,
                t.atoms.bg_contrast_25,
                {
                  width: 32,
                  height: 32,
                },
              ]}>
              <ListIcon size="md" fill={t.atoms.text_contrast_low.color} />
            </View>
            <Text
              style={[
                a.text_center,
                a.flex_1,
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                {
                  maxWidth: 200,
                },
              ]}>
              {emptyText}
            </Text>
          </View>
        )
      } else if (item === ERROR_ITEM) {
        console.log('error:', error)
        return (
          <ErrorMessage message={cleanError(error)} onPressTryAgain={refetch} />
        )
      } else if (item === LOADING) {
        return (
          <View style={{padding: 20}}>
            <ActivityIndicator />
          </View>
        )
      }
      return <Post post={item} />
    },
    [
      t.atoms.bg_contrast_25,
      t.atoms.text_contrast_low.color,
      t.atoms.text_contrast_medium,
      emptyText,
      error,
      refetch,
    ],
  )

  if (inline) {
    return (
      <View testID={testID} style={style}>
        {posts.length > 0 ? (
          <RNFlatList
            testID={testID ? `${testID}-flatlist` : undefined}
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={renderItemInner}
            refreshControl={
              <RefreshControl
                refreshing={isPTRing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
              />
            }
            contentContainerStyle={[s.contentContainer]}
            removeClippedSubviews={true}
          />
        ) : (
          <EmptyState icon="bookmark" message={_(msg`No bookmarks yet!`)} />
        )}
      </View>
    )
  } else {
    return (
      <View testID={testID} style={style}>
        {posts.length > 0 ? (
          <List
            testID={testID ? `${testID}-flatlist` : undefined}
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={renderItemInner}
            refreshing={isPTRing}
            onRefresh={onRefresh}
            contentContainerStyle={[s.contentContainer]}
            removeClippedSubviews={true}
            desktopFixedHeight
            sideBorders={false}
          />
        ) : (
          <EmptyState icon="bookmark" message={_(msg`No bookmarks yet!`)} />
        )}
      </View>
    )
  }
}
