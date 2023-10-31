import React, {useCallback, useEffect, useMemo} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {MiniblogModel} from 'state/models/feeds/waverly/miniblog'
import {RichText} from 'view/com/util/text/RichText'
import {View, StyleSheet, ScrollView} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {PostThreadModel} from 'state/models/content/post-thread'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {DotDotDotIcon, ShareIcon} from 'lib/icons-w2'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {CardHeader} from '../card/CardHeader'
import {PostThreadItemModel} from 'state/models/content/post-thread-item'
import {RichText as RichTextObj} from '@atproto/api'
import {EmbedBlock} from '../card/EmbedBlock'
import {useEmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {IsQuote, QuoteInfo} from '../util/Quote'
import {WaverlyScreenPadding} from '../WaverlyScreenPadding'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'WaverlyPost'>

export const WaverlyPost = observer(function WaverlyPost({route}: Props) {
  const pal = usePalette('default')
  const store = useStores()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const groupPost = useMemo(
    () => new PostThreadModel(store, {uri}),
    [store, uri],
  )
  const readerLink = useMemo(
    () => `/profile/${name}/reader/${rkey}`,
    [name, rkey],
  )

  const userPost = useMemo(
    () => groupPost.thread?.parent as PostThreadItemModel | undefined,
    [groupPost.thread?.parent],
  )

  const miniblog = useMemo(
    () =>
      groupPost.thread?.data &&
      MiniblogModel.fromFeedItem(store, groupPost.thread?.data),
    [groupPost.thread?.data, store],
  )

  useFocusEffect(
    useCallback(() => {
      store.shell.setMinimalShellMode(true)
      store.shell.setFabUseDefaultCallbacks()
      const threadCleanup = groupPost.registerListeners()
      if (!groupPost.hasLoaded && !groupPost.isLoading) {
        groupPost.setup().catch(err => {
          store.log.error('Failed to fetch post', err)
        })
      }
      return () => {
        threadCleanup()
      }
    }, [groupPost, store.log, store.shell]),
  )

  useEffect(() => {
    if (miniblog && !miniblog.hasLoaded && !miniblog.isLoading) {
      miniblog.load().catch(err => {
        store.log.error('Failed to fetch miniblog', err)
      })
    }
  }, [miniblog, store])

  let bodyText = miniblog?.richText?.text || ''

  // Make a list of all paragraphs in the post that are a quote.
  let quoteList: QuoteInfo[] = []
  if (miniblog?.richText)
    miniblog.richText.text.split('\n').forEach(a => {
      const qi = IsQuote(a)
      if (qi.bIsQuote) quoteList.push(qi)
    })

  // TODO: for now, we're only comparing against the first quote block.
  const firstQuote = quoteList.length > 0 ? quoteList[0] : undefined

  // Strip away quote blocks, leaving only non-quote paragraphs.
  const paragraphs = miniblog?.richText
    ? new RichTextObj({
        text: miniblog.richText.text
          .split('\n')
          .filter(
            text =>
              text.length > 0 && (!firstQuote || text !== firstQuote.orig),
          )
          .join('\n\n'),
        facets: miniblog.richText!.facets,
      })
    : undefined

  const embedInfo = useEmbedInfo(
    userPost?.data.post.embed,
    readerLink,
    firstQuote?.asQuote,
  )

  return (
    <WaverlyScreenPadding>
      <ViewHeader showOnDesktop={true} renderButton={() => <HeaderButtons />} />
      <ScrollView contentContainerStyle={[styles.container, pal.view]}>
        <View style={styles.hMargins}>
          <CardHeader
            userName={userPost?.data.post.author.displayName ?? '<unknown>'}
            avatar={userPost?.data.post.author.avatar}
            // group={
            //   groupPost.thread && {
            //     displayName:
            //       groupPost.thread.data.post.author.displayName ??
            //       '<unknown group>',
            //     handle: groupPost.thread.data.post.author.handle,
            //   }
            // }
          />
        </View>
        <EmbedBlock embedInfo={embedInfo} />
        {bodyText && (
          <View style={[styles.hMargins, styles.paragraphs]}>
            <RichText
              key={`post-card-body`}
              type="post-text"
              style={[pal.text]}
              lineHeight={1.6}
              richText={paragraphs}
              //numberOfLines={30}
            />
          </View>
        )}
      </ScrollView>
    </WaverlyScreenPadding>
  )
})

const HeaderButtons = () => {
  const pal = usePalette('default')

  return (
    <View style={styles.headerButtons}>
      <TouchableOpacity accessibilityRole="button" style={styles.button}>
        <ShareIcon size={24} style={[pal.text]} />
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.button}>
        <DotDotDotIcon size={24} style={pal.text} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 200,
    gap: 16,
    alignItems: 'stretch',
  },
  hMargins: {
    marginHorizontal: 16,
  },
  paragraphs: {
    gap: 28,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 24,
    heigh: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
