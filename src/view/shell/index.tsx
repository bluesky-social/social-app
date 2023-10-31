import React, {useCallback, useEffect, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {StatusBar} from 'expo-status-bar'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {Drawer} from 'react-native-drawer-layout'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import {useStores} from 'state/index'
import {ModalsContainer} from 'view/com/modals/Modal'
import {Lightbox} from 'view/com/lightbox/Lightbox'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {DrawerContent} from './Drawer'
import {Composer} from './Composer'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import * as backHandler from 'lib/routes/back-handler'
import {RoutesContainer, TabsNavigator} from '../../Navigation'
import {isStateAtTabRoot} from 'lib/routes/helpers'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useOTAUpdate} from 'lib/hooks/useOTAUpdate'
import {
  DraggableFab,
  useOnFabPickMoved,
} from 'view/com/w2/web-reader/DraggableFab'
import {fabStyleRound, fabStyleSquare} from 'view/com/w2/universal-fab-style'
import {NavigationProp} from 'lib/routes/types'

const ShellInner = observer(function ShellInnerImpl() {
  const store = useStores()
  useOTAUpdate() // this hook polls for OTA updates every few seconds
  const winDim = useWindowDimensions()
  const renderDrawerContent = React.useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = React.useCallback(
    () => store.shell.openDrawer(),
    [store],
  )
  const onCloseDrawer = React.useCallback(
    () => store.shell.closeDrawer(),
    [store],
  )
  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  React.useEffect(() => {
    backHandler.init(store)
  }, [store])

  const [fabSize, setFabSize] = useState<
    {width: number; height: number} | undefined
  >({
    width: 0,
    height: 0,
  })

  // Tracks the fab as it moves.
  const [pointer, setPointer] = useState<{x: number; y: number} | undefined>()
  useEffect(() => {
    if (pointer) store.shell.onFabMoved(pointer.x, pointer.y)
  }, [pointer, store.shell])

  const navigation = useNavigation<NavigationProp>()
  //const {track} = useAnalytics()
  /*
  const onEnterWaverlyChat = React.useCallback(
    (pd: PickableData | undefined) => {
      track(`MobileShell:WaverlyChatButtonPressed`)
      store.shell.closeModal()
      store.waverlyChat.advanceSession()
      if (pd) {
        if (pd.type === 'postText') {
          store.waverlyChat.addToConversation(pd.data, true)
          store.waverlyChat.addToConversation(
            'How can I help you with this post?',
            true,
          )
        } else if (pd.type === 'UGCBody') {
          const groupPost = pd.data as PostsFeedItemModel
          store.waverlyChat.addToConversation_groupPost(groupPost)
          store.waverlyChat.addToConversation(
            'How can I help you with this post?',
            true,
          )
        } else if (pd.type === 'RecBody') {
          //data={card.rec}
          store.waverlyChat.addToConversation('You launched with RecBody', true)
        } else if (pd.type === 'embedInfo') {
          const embedInfo = pd.data as EmbedInfo
          // const hasURI: boolean = embedInfo.link ? true : false
          // const hasImage: boolean = embedInfo.image ? true : false
          // const hasQuote: boolean = embedInfo.quote ? true : false
          store.waverlyChat.addToConversation_Embed(embedInfo)
          store.waverlyChat.setSessionContext(embedInfo)

          // if (hasURI) {
          //   if (embedInfo.link?.originalUri) {
          //     store.waverlyChat.addToConversation(
          //       'Link: ' + embedInfo.link?.originalUri,
          //       true,
          //     )
          //   }
          //   if (embedInfo.link?.title)
          //     store.waverlyChat.addToConversation(
          //       'Title: ' + embedInfo.link?.title,
          //       true,
          //     )
          //   if (embedInfo.link?.description)
          //     store.waverlyChat.addToConversation(
          //       'Description: ' + embedInfo.link?.description,
          //       true,
          //     )
          // }
          // if (hasImage)
          //   store.waverlyChat.addToConversation(
          //     'Image: ' + embedInfo.image?.uri,
          //     true,
          //   )
          // if (hasQuote)
          //   store.waverlyChat.addToConversation(
          //     'Quote: ' + embedInfo.quote,
          //     true,
          //   )


          store.waverlyChat.addToConversation(
            'How can I help you with this?',
            true,
          )
        } else if (pd.type === 'groupInfo') {
          const groupInfo = pd.data as ProfileViewBasic
          store.waverlyChat.addToConversation_UserProfile(groupInfo)
          store.waverlyChat.addToConversation(
            'Can I help you with this Wave?',
            true,
          )
        } else if (pd.type === 'userInfo') {
          const userInfo = pd.data as ProfileViewBasic
          store.waverlyChat.addToConversation_UserProfile(userInfo)
          const isWaverlyRec = userInfo.displayName === 'Waverly'
          store.waverlyChat.addToConversation(
            isWaverlyRec
              ? 'Would you like to configure Waverly recommendations?'
              : 'Can I help you with this user?',
            true,
          )
        }
      } else {
        store.waverlyChat.addToConversation('What can I help you with?', true)
      }
      navigation.navigate('WaverlyChatScreen')
      store.shell.closeDrawer()
    },
    [navigation, store.shell, store.waverlyChat, track],
  )
  */

  /*
  const gotoWordDJ = React.useCallback(
    (pd: PickableData | undefined) => {
      store.shell.closeModal()
      store.wordDJModel.clear()
      if (pd) {
        if (pd.type === 'postText') {
          store.wordDJModel.setManualPayload(pd.data)
        } else if (pd.type === 'UGCBody') {
          //data={card.groupPost}
          store.wordDJModel.setManualPayload('Launched with UGCBody')
        } else if (pd.type === 'RecBody') {
          //data={card.rec}
          store.wordDJModel.setManualPayload('Launched with RecBody')
        } else if (pd.type === 'embedInfo') {
          const embedInfo = pd.data as EmbedInfo
          const hasURI: boolean = embedInfo.link ? true : false
          const hasImage: boolean = embedInfo.image ? true : false
          const hasQuote: boolean = embedInfo.quote ? true : false
          let payload: string = ''
          if (hasURI) {
            payload += 'Link: ' + embedInfo.link?.originalUri + '\n'
            if (embedInfo.link?.title)
              payload += 'Title: ' + embedInfo.link?.title + '\n'
            if (embedInfo.link?.description)
              payload += 'Description: ' + embedInfo.link?.description + '\n'
          }
          if (hasImage) payload += 'Image: ' + embedInfo.image?.uri + '\n'
          if (hasQuote) payload += '""' + embedInfo.quote + '\n'

          payload += "What's on your mind?"
          store.wordDJModel.setManualPayload(payload)
        } else if (pd.type === 'groupInfo') {
          const groupInfo = pd.data as ProfileViewBasic
          store.wordDJModel.setGroup({
            did: groupInfo.did,
            handle: groupInfo.handle,
          })
          store.wordDJModel.setManualPayload("What's on your mind?")
          //data={group!.did}
        } else if (pd.type === 'userInfo') {
          const userInfo = pd.data as ProfileViewBasic
          //const isWaverlyRec = userInfo.displayName === 'Waverly'
          const prompt = 'Write a post about user ' + userInfo.displayName
          store.wordDJModel.setManualPayload(prompt)
        }
        store.wordDJModel.updateAuthoritativeStateForMode()
      } else store.wordDJModel.setManualPayload("What's on your mind?")
      store.wordDJModel.updateAuthoritativeStateForMode()
      navigation.navigate('WordDJScreen')
    },
    [navigation, store.shell, store.wordDJModel],
  )
  */

  // const showContextCarousel = React.useCallback(() => {
  //   navigation.navigate('ContextCarouselScreen')
  //   store.shell.closeDrawer()
  //   store.shell.closeModal()
  // }, [navigation, store.shell])

  // const showModal = React.useCallback(() => {
  //   const pd = store.shell.getPickableData(store.shell.hitting.pickID)
  //   store.shell.clearHitting()

  //   store.shell.openModal({
  //     name: 'waverly-button',
  //     onWordDJ: gotoWordDJ,
  //     onWaverlyChat: onEnterWaverlyChat,
  //     pickableData: pd,
  //   })
  // }, [gotoWordDJ, onEnterWaverlyChat, store.shell])

  const onFabPickMoved = useOnFabPickMoved(fabSize)
  const onFabMoved = useCallback(
    (x: number, y: number) => {
      store.shell.setHasFabMoved(true)
      onFabPickMoved(x, y)
    },
    [onFabPickMoved, store.shell],
  )
  //const onFabMoved = useOnFabPickMoved(fabSize)

  const onFabRelease = React.useCallback(() => {
    // Open the carousel if nothing specific was pciked.  Otherwise, prompt
    // the user what to do with the picked thing.
    // const pd = store.shell.getPickableData(store.shell.hitting.pickID)
    // if (pd) showModal()
    // else showContextCarousel()

    // Record any context, then launch the Context Carousel
    const pd = store.shell.getPickableData(store.shell.hitting.pickID)
    store.waverlyContext.setPickableData(pd)
    store.shell.clearHitting()
    navigation.navigate('ContextCarouselScreen')
  }, [navigation, store.shell, store.waverlyContext])

  useEffect(() => {
    store.shell.setFabDefaultCallbacks(onFabMoved, onFabRelease)
  }, [onFabMoved, onFabRelease, store.shell])

  // Wire up the Waverly FAB to the shell fab callbacks.
  const onFabPressed = useCallback(() => {
    store.shell.clearHitting()
    store.shell.setIsFabPressed(true)
  }, [store.shell])
  const onFabReleased = useCallback(() => {
    store.shell.onFabReleased()
    store.shell.setIsFabPressed(false)
    store.shell.setHasFabMoved(false)
  }, [store.shell])

  return (
    <>
      <View style={styles.outerContainer}>
        <ErrorBoundary>
          <Drawer
            renderDrawerContent={renderDrawerContent}
            open={store.shell.isDrawerOpen}
            onOpen={onOpenDrawer}
            onClose={onCloseDrawer}
            swipeEdgeWidth={winDim.width / 2}
            swipeEnabled={
              !canGoBack &&
              store.session.hasSession &&
              !store.shell.isDrawerSwipeDisabled
            }>
            <TabsNavigator />
            {store.shell.isFabVisible && (
              /*store.session.hasSession &&*/ <DraggableFab
                offset={store.shell.fabOffset}
                setPos={setPointer}
                setSize={setFabSize}
                onPressed={onFabPressed}
                onReleased={onFabReleased}
                fabMode={store.shell.fabMode}
                isFabMovable={store.shell.isFabMovable}
                style={
                  store.shell.fabStyle === 'round'
                    ? fabStyleRound
                    : fabStyleSquare
                }
              />
            )}
          </Drawer>
        </ErrorBoundary>
      </View>
      <Lightbox />
      <Composer
        active={store.shell.isComposerActive}
        winHeight={winDim.height}
        replyTo={store.shell.composerOpts?.replyTo}
        onPost={store.shell.composerOpts?.onPost}
        quote={store.shell.composerOpts?.quote}
      />
      <ModalsContainer />
    </>
  )
})

export const Shell: React.FC = observer(function ShellImpl() {
  const pal = usePalette('default')
  const theme = useTheme()
  return (
    <SafeAreaProvider style={pal.view}>
      <View testID="mobileShellView" style={pal.view}>
        <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
        <RoutesContainer>
          <ShellInner />
        </RoutesContainer>
      </View>
    </SafeAreaProvider>
  )
})

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
})
