import React, {useCallback, useRef} from 'react'
import {FlatList, LayoutChangeEvent, View} from 'react-native'
import {
  KeyboardStickyView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller'
import {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/hook/commonTypes'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AppBskyEmbedRecord, AppBskyRichtextFacet, RichText} from '@atproto/api'

import {clamp} from '#/lib/numbers'
import {ScrollProvider} from '#/lib/ScrollContext'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {
  convertBskyAppUrlIfNeeded,
  isBskyPostUrl,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {isWeb} from '#/platform/detection'
import {isConvoActive, useConvoActive} from '#/state/messages/convo'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo/types'
import {useGetPost} from '#/state/queries/post'
import {useAgent} from '#/state/session'
import {
  EmojiPicker,
  EmojiPickerState,
} from '#/view/com/composer/text-input/web/EmojiPicker.web'
import {List} from '#/view/com/util/List'
import {ChatDisabled} from '#/screens/Messages/components/ChatDisabled'
import {MessageInput} from '#/screens/Messages/components/MessageInput'
import {MessageListError} from '#/screens/Messages/components/MessageListError'
import {ChatEmptyPill} from '#/components/dms/ChatEmptyPill'
import {MessageItem} from '#/components/dms/MessageItem'
import {NewMessagesPill} from '#/components/dms/NewMessagesPill'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {MessageInputEmbed, useMessageEmbed} from './MessageInputEmbed'

function MaybeLoader({isLoading}: {isLoading: boolean}) {
  return (
    <View
      style={{
        height: 50,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {isLoading && <Loader size="xl" />}
    </View>
  )
}

function renderItem({item}: {item: ConvoItem}) {
  if (item.type === 'message' || item.type === 'pending-message') {
    return <MessageItem item={item} />
  } else if (item.type === 'deleted-message') {
    return <Text>Deleted message</Text>
  } else if (item.type === 'error') {
    return <MessageListError item={item} />
  }

  return null
}

function keyExtractor(item: ConvoItem) {
  return item.key
}

function onScrollToIndexFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList({
  hasScrolled,
  setHasScrolled,
  blocked,
  footer,
}: {
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  blocked?: boolean
  footer?: React.ReactNode
}) {
  const convoState = useConvoActive()
  const agent = useAgent()
  const getPost = useGetPost()
  const {embedUri, setEmbed} = useMessageEmbed()

  const flatListRef = useAnimatedRef<FlatList>()

  const [newMessagesPill, setNewMessagesPill] = React.useState({
    show: false,
    startContentOffset: 0,
  })

  const [emojiPickerState, setEmojiPickerState] =
    React.useState<EmojiPickerState>({
      isOpen: false,
      pos: {top: 0, left: 0, right: 0, bottom: 0},
    })

  // We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
  // are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
  // the bottom.
  const isAtBottom = useSharedValue(true)

  // This will be used on web to assist in determining if we need to maintain the content offset
  const isAtTop = useSharedValue(true)

  // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
  // onStartReached to fire.
  const prevContentHeight = useRef(0)
  const prevItemCount = useRef(0)

  // -- Keep track of background state and positioning for new pill
  const layoutHeight = useSharedValue(0)
  const didBackground = React.useRef(false)
  React.useEffect(() => {
    if (convoState.status === ConvoStatus.Backgrounded) {
      didBackground.current = true
    }
  }, [convoState.status])

  // -- Scroll handling

  // Every time the content size changes, that means one of two things is happening:
  // 1. New messages are being added from the log or from a message you have sent
  // 2. Old messages are being prepended to the top
  //
  // The first time that the content size changes is when the initial items are rendered. Because we cannot rely on
  // `initialScrollIndex`, we need to immediately scroll to the bottom of the list. That scroll will not be animated.
  //
  // Subsequent resizes will only scroll to the bottom if the user is at the bottom of the list (within 100 pixels of
  // the bottom). Therefore, any new messages that come in or are sent will result in an animated scroll to end. However
  // we will not scroll whenever new items get prepended to the top.
  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      // Because web does not have `maintainVisibleContentPosition` support, we will need to manually scroll to the
      // previous off whenever we add new content to the previous offset whenever we add new content to the list.
      if (isWeb && isAtTop.get() && hasScrolled) {
        flatListRef.current?.scrollToOffset({
          offset: height - prevContentHeight.current,
          animated: false,
        })
      }

      // This number _must_ be the height of the MaybeLoader component
      if (height > 50 && isAtBottom.get()) {
        // If the size of the content is changing by more than the height of the screen, then we don't
        // want to scroll further than the start of all the new content. Since we are storing the previous offset,
        // we can just scroll the user to that offset and add a little bit of padding. We'll also show the pill
        // that can be pressed to immediately scroll to the end.
        if (
          didBackground.current &&
          hasScrolled &&
          height - prevContentHeight.current > layoutHeight.get() - 50 &&
          convoState.items.length - prevItemCount.current > 1
        ) {
          flatListRef.current?.scrollToOffset({
            offset: prevContentHeight.current - 65,
            animated: true,
          })
          setNewMessagesPill({
            show: true,
            startContentOffset: prevContentHeight.current - 65,
          })
        } else {
          flatListRef.current?.scrollToOffset({
            offset: height,
            animated: hasScrolled && height > prevContentHeight.current,
          })

          // HACK Unfortunately, we need to call `setHasScrolled` after a brief delay,
          // because otherwise there is too much of a delay between the time the content
          // scrolls and the time the screen appears, causing a flicker.
          // We cannot actually use a synchronous scroll here, because `onContentSizeChange`
          // is actually async itself - all the info has to come across the bridge first.
          if (!hasScrolled && !convoState.isFetchingHistory) {
            setTimeout(() => {
              setHasScrolled(true)
            }, 100)
          }
        }
      }

      prevContentHeight.current = height
      prevItemCount.current = convoState.items.length
      didBackground.current = false
    },
    [
      hasScrolled,
      setHasScrolled,
      convoState.isFetchingHistory,
      convoState.items.length,
      // these are stable
      flatListRef,
      isAtTop,
      isAtBottom,
      layoutHeight,
    ],
  )

  const onStartReached = useCallback(() => {
    if (hasScrolled && prevContentHeight.current > layoutHeight.get()) {
      convoState.fetchMessageHistory()
    }
  }, [convoState, hasScrolled, layoutHeight])

  const onScroll = React.useCallback(
    (e: ReanimatedScrollEvent) => {
      'worklet'
      layoutHeight.set(e.layoutMeasurement.height)
      const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height

      // Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
      // when a new message is added, hence the 100 pixel offset
      isAtBottom.set(e.contentSize.height - 100 < bottomOffset)
      isAtTop.set(e.contentOffset.y <= 1)

      if (
        newMessagesPill.show &&
        (e.contentOffset.y > newMessagesPill.startContentOffset + 200 ||
          isAtBottom.get())
      ) {
        runOnJS(setNewMessagesPill)({
          show: false,
          startContentOffset: 0,
        })
      }
    },
    [layoutHeight, newMessagesPill, isAtBottom, isAtTop],
  )

  // -- Keyboard animation handling
  const {bottom: bottomInset} = useSafeAreaInsets()
  const bottomOffset = isWeb ? 0 : clamp(60 + bottomInset, 60, 75)

  const keyboardHeight = useSharedValue(0)
  const keyboardIsOpening = useSharedValue(false)

  // In some cases - like when the emoji piker opens - we don't want to animate the scroll in the list onLayout event.
  // We use this value to keep track of when we want to disable the animation.
  const layoutScrollWithoutAnimation = useSharedValue(false)

  useKeyboardHandler({
    onStart: e => {
      'worklet'
      // Immediate updates - like opening the emoji picker - will have a duration of zero. In those cases, we should
      // just update the height here instead of having the `onMove` event do it (that event will not fire!)
      if (e.duration === 0) {
        layoutScrollWithoutAnimation.set(true)
        keyboardHeight.set(e.height)
      } else {
        keyboardIsOpening.set(true)
      }
    },
    onMove: e => {
      'worklet'
      keyboardHeight.set(e.height)
      if (e.height > bottomOffset) {
        scrollTo(flatListRef, 0, 1e7, false)
      }
    },
    onEnd: () => {
      'worklet'
      keyboardIsOpening.set(false)
    },
  })

  const animatedListStyle = useAnimatedStyle(() => ({
    marginBottom:
      keyboardHeight.get() > bottomOffset ? keyboardHeight.get() : bottomOffset,
  }))

  // -- Message sending
  const onSendMessage = useCallback(
    async (text: string) => {
      let rt = new RichText({text: text.trimEnd()}, {cleanNewlines: true})

      // detect facets without resolution first - this is used to see if there's
      // any post links in the text that we can embed. We do this first because
      // we want to remove the post link from the text, re-trim, then detect facets
      rt.detectFacetsWithoutResolution()

      let embed: AppBskyEmbedRecord.Main | undefined

      if (embedUri) {
        try {
          const post = await getPost({uri: embedUri})
          if (post) {
            embed = {
              $type: 'app.bsky.embed.record',
              record: {
                uri: post.uri,
                cid: post.cid,
              },
            }

            // look for the embed uri in the facets, so we can remove it from the text
            const postLinkFacet = rt.facets?.find(facet => {
              return facet.features.find(feature => {
                if (AppBskyRichtextFacet.isLink(feature)) {
                  if (isBskyPostUrl(feature.uri)) {
                    const url = convertBskyAppUrlIfNeeded(feature.uri)
                    const [_0, _1, _2, rkey] = url.split('/').filter(Boolean)

                    // this might have a handle instead of a DID
                    // so just compare the rkey - not particularly dangerous
                    return post.uri.endsWith(rkey)
                  }
                }
                return false
              })
            })

            if (postLinkFacet) {
              const isAtStart = postLinkFacet.index.byteStart === 0
              const isAtEnd =
                postLinkFacet.index.byteEnd === rt.unicodeText.graphemeLength

              // remove the post link from the text
              if (isAtStart || isAtEnd) {
                rt.delete(
                  postLinkFacet.index.byteStart,
                  postLinkFacet.index.byteEnd,
                )
              }

              rt = new RichText({text: rt.text.trim()}, {cleanNewlines: true})
            }
          }
        } catch (error) {
          logger.error('Failed to get post as quote for DM', {error})
        }
      }

      await rt.detectFacets(agent)

      rt = shortenLinks(rt)
      rt = stripInvalidMentions(rt)

      if (!hasScrolled) {
        setHasScrolled(true)
      }

      convoState.sendMessage({
        text: rt.text,
        facets: rt.facets,
        embed,
      })
    },
    [agent, convoState, embedUri, getPost, hasScrolled, setHasScrolled],
  )

  // -- List layout changes (opening emoji keyboard, etc.)
  const onListLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      layoutHeight.set(e.nativeEvent.layout.height)

      if (isWeb || !keyboardIsOpening.get()) {
        flatListRef.current?.scrollToEnd({
          animated: !layoutScrollWithoutAnimation.get(),
        })
        layoutScrollWithoutAnimation.set(false)
      }
    },
    [
      flatListRef,
      keyboardIsOpening,
      layoutScrollWithoutAnimation,
      layoutHeight,
    ],
  )

  const scrollToEndOnPress = React.useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: prevContentHeight.current,
      animated: true,
    })
  }, [flatListRef])

  return (
    <>
      {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
      <ScrollProvider onScroll={onScroll}>
        <List
          ref={flatListRef}
          data={convoState.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          disableFullWindowScroll={true}
          disableVirtualization={true}
          style={animatedListStyle}
          // The extra two items account for the header and the footer components
          initialNumToRender={isNative ? 32 : 62}
          maxToRenderPerBatch={isWeb ? 32 : 62}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          removeClippedSubviews={false}
          sideBorders={false}
          onContentSizeChange={onContentSizeChange}
          onLayout={onListLayout}
          onStartReached={onStartReached}
          onScrollToIndexFailed={onScrollToIndexFailed}
          scrollEventThrottle={100}
          ListHeaderComponent={
            <MaybeLoader isLoading={convoState.isFetchingHistory} />
          }
        />
      </ScrollProvider>
      <KeyboardStickyView offset={{closed: -bottomOffset, opened: 0}}>
        {convoState.status === ConvoStatus.Disabled ? (
          <ChatDisabled />
        ) : blocked ? (
          footer
        ) : (
          <>
            {isConvoActive(convoState) &&
              !convoState.isFetchingHistory &&
              convoState.items.length === 0 && <ChatEmptyPill />}
            <MessageInput
              onSendMessage={onSendMessage}
              hasEmbed={!!embedUri}
              setEmbed={setEmbed}
              openEmojiPicker={pos => setEmojiPickerState({isOpen: true, pos})}>
              <MessageInputEmbed embedUri={embedUri} setEmbed={setEmbed} />
            </MessageInput>
          </>
        )}
      </KeyboardStickyView>

      {isWeb && (
        <EmojiPicker
          pinToTop
          state={emojiPickerState}
          close={() => setEmojiPickerState(prev => ({...prev, isOpen: false}))}
        />
      )}

      {newMessagesPill.show && <NewMessagesPill onPress={scrollToEndOnPress} />}
    </>
  )
}
