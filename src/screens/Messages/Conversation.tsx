import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import {KeyboardGestureArea} from 'react-native-keyboard-controller'
import Animated, {FadeOut} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ScrollEdgeEffectProvider} from '@bsky.app/expo-scroll-edge-effect'
import {Trans, useLingui} from '@lingui/react/macro'
import {
  type RouteProp,
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useViewportZoomLock} from '#/lib/hooks/useViewportZoomLock'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {ConvoProvider, isConvoActive, useConvo} from '#/state/messages/convo'
import {type ConvoState, ConvoStatus} from '#/state/messages/convo/types'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useConvoQuery} from '#/state/queries/messages/conversation'
import {useSession} from '#/state/session'
import {ChatSkeleton} from '#/screens/Messages/components/ChatSkeleton'
import {MessageComposer} from '#/screens/Messages/components/MessageComposer'
import {MessageInput} from '#/screens/Messages/components/MessageInput'
import {
  getChatBottomReservation,
  MessagesList,
} from '#/screens/Messages/components/MessagesList'
import {useBlockForEmailVerification} from '#/screens/Messages/hooks/useBlockForEmailVerification'
import {useChatFooterOverride} from '#/screens/Messages/hooks/useChatFooterOverride'
import {useInputHeight} from '#/screens/Messages/hooks/useInputHeight'
import {useSendChatMessage} from '#/screens/Messages/hooks/useSendChatMessage'
import {atoms as a, platform, tokens, useTheme, web} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import * as Dialog from '#/components/Dialog'
import {ChatEmptyPill} from '#/components/dms/ChatEmptyPill'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {Error} from '#/components/Error'
import * as Layout from '#/components/Layout'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_INTERNAL, IS_LIQUID_GLASS, IS_WEB} from '#/env'
import {ChatStatusInfo} from './components/ChatStatusInfo'
import {ConvoHeader} from './components/ConvoHeader'
import {InviteLinkDialogProvider} from './components/InviteLinkDialogProvider'
import {
  MessageInputEmbed,
  useMessageEmbed,
} from './components/MessageInputEmbed'
import {KeyboardStickyView} from './components/vendor/KeyboardStickyView'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>

export function MessagesConversationScreen(props: Props) {
  const {t: l} = useLingui()
  const aaCopy = useAgeAssuranceCopy()
  return (
    <AgeRestrictedScreen
      screenTitle={l`Conversation`}
      infoText={aaCopy.chatsInfoText}>
      <MessagesConversationScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

export function MessagesConversationScreenInner({route}: Props) {
  const convoId = route.params.conversation
  const {setCurrentConvoId} = useCurrentConvoId()

  useFocusEffect(
    useCallback(() => {
      setCurrentConvoId(convoId)

      return () => {
        setCurrentConvoId(undefined)
      }
    }, [convoId, setCurrentConvoId]),
  )

  return (
    <Layout.Screen
      minimalShell
      testID="convoScreen"
      noInsetTop={IS_LIQUID_GLASS}
      style={web([{minHeight: 0}, a.flex_1])}>
      <ScrollEdgeEffectProvider>
        <ConvoProvider key={convoId} convoId={convoId}>
          <Inner convoId={convoId} />
        </ConvoProvider>
      </ScrollEdgeEffectProvider>
    </Layout.Screen>
  )
}

function Inner({convoId}: {convoId: string}) {
  const convoState = useConvo()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const isFocused = useIsFocused()
  const {data: convoData} = useConvoQuery({convoId})

  useViewportZoomLock({enabled: isFocused})

  const convo = convoData
    ? parseConvoView(convoData, currentAccount?.did)
    : null

  // Because we want to give the list a chance to asynchronously scroll to the end before it is visible to the user,
  // we use `hasScrolled` to determine when to render. With that said however, there is a chance that the chat will be
  // empty. So, we also check for that possible state as well and render once we can.
  const [hasScrolled, setHasScrolled] = useState(false)
  const readyToShow =
    hasScrolled ||
    (isConvoActive(convoState) &&
      !convoState.isFetchingHistory &&
      convoState.items.length === 0)

  // Any time that we re-render the `Initializing` state, we have to reset `hasScrolled` to false. After entering this
  // state, we know that we're resetting the list of messages and need to re-scroll to the bottom when they get added.
  const [prevState, setPrevState] = useState(convoState.status)
  if (prevState !== convoState.status) {
    setPrevState(convoState.status)
    if (convoState.status === ConvoStatus.Initializing) {
      setHasScrolled(false)
    }
  }

  if (convoState.status === ConvoStatus.Error) {
    return (
      <>
        <Layout.Center style={[a.w_full]}>
          <ConvoHeader convo={convo} />
        </Layout.Center>
        <Error
          title={l`Something went wrong`}
          message={l`We couldn't load this conversation`}
          onRetry={() => convoState.error.retry()}
          sideBorders={false}
        />
      </>
    )
  }

  return (
    <Layout.Center style={[a.flex_1]}>
      {/* MessagesList does not use the body scroll */}
      {isFocused && IS_WEB && <RemoveScrollBar />}
      <ChatBody
        convo={convo}
        convoState={convoState}
        hasScrolled={hasScrolled}
        setHasScrolled={setHasScrolled}
        readyToShow={readyToShow}
      />
    </Layout.Center>
  )
}

/**
 * Owns the keyboard/composer area. To keep the composer from jumping around,
 * it's mounted once and always occupies the same real estate, regardless of
 * whether we're showing the `MessagesList` or the `ChatSkeleton` above it.
 */
function ChatBody({
  convo,
  convoState,
  hasScrolled,
  setHasScrolled,
  readyToShow,
}: {
  convo: ConvoWithDetails | null
  convoState: ConvoState
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  readyToShow: boolean
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const {params} =
    useRoute<RouteProp<CommonNavigatorParams, 'MessagesConversation'>>()
  const {embedUri, setEmbed} = useMessageEmbed()

  const isActive = isConvoActive(convoState)
  const isDisabled = convoState.status === ConvoStatus.Disabled
  const hasMessages = isActive && convoState.items.length > 0

  const textInputId = `chat-input-${useId()}`
  const {inputHeightUI, inputHeightJS, onInputLayout} = useInputHeight()

  const [headerHeight, setHeaderHeight] = useState(0)
  const onHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height)
  }

  const [footerHeight, setFooterHeight] = useState(0)
  const onFooterLayout = (e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height)
  }

  useBlockForEmailVerification()

  const footerOverride = useChatFooterOverride({convo, isDisabled, hasMessages})

  const onSendMessage = useSendChatMessage({
    convoState,
    embedUri,
    hasScrolled,
    setHasScrolled,
  })

  return (
    <InviteLinkDialogProvider convo={convo}>
      <ConvoHeader convo={convo} onLayout={onHeaderLayout} />
      <KeyboardGestureArea
        interpolator="ios"
        // HACKFIX: https://github.com/kirillzyusko/react-native-keyboard-controller/issues/1419
        offset={Math.round(inputHeightJS)}
        // TODO slightly too buggy unfortunately, enable when possible
        // textInputNativeID={textInputId}
        style={[a.flex_1]}>
        <View style={[a.flex_1]}>
          {isActive && (
            <MessagesList
              hasScrolled={hasScrolled}
              setHasScrolled={setHasScrolled}
              transparentHeaderHeight={IS_LIQUID_GLASS ? headerHeight : 0}
              inputHeightUI={inputHeightUI}
              inputHeightJS={inputHeightJS}
            />
          )}
          {!readyToShow && (
            <Animated.View
              exiting={FadeOut.duration(200)}
              style={[
                a.absolute,
                web(a.px_md),
                {top: 0, left: 0, right: 0, bottom: 0},
                t.atoms.bg,
              ]}>
              <ChatSkeleton
                convo={convo}
                transparentHeaderHeight={IS_LIQUID_GLASS ? headerHeight : 0}
                bottomPadding={getChatBottomReservation({
                  inputHeight: footerOverride ? footerHeight : inputHeightJS,
                  bottomInset,
                })}
              />
            </Animated.View>
          )}
        </View>
        <KeyboardStickyView
          style={[a.absolute, a.bottom_0, a.left_0, a.right_0]}
          onLayout={footerOverride ? onFooterLayout : onInputLayout}
          minimumOffset={bottomInset}
          offset={{
            closed: platform({
              ios: tokens.space.lg, // hide bottom padding when closed
              default: 0,
            }),
            opened: 0,
          }}>
          {footerOverride ?? (
            <ConversationFooter
              convoState={convoState}
              hasAcceptOverride={!!params.accept}>
              {ax.features.enabled(ax.features.DmsNewMessageComposerEnable) ? (
                <MessageComposer
                  textInputId={textInputId}
                  onSendMessage={(message: string) =>
                    void onSendMessage(message)
                  }
                  hasEmbed={!!embedUri}
                  setEmbed={setEmbed}
                  loading={!readyToShow}>
                  <MessageInputEmbed embedUri={embedUri} setEmbed={setEmbed} />
                </MessageComposer>
              ) : (
                <MessageInput
                  textInputId={textInputId}
                  onSendMessage={onSendMessage}
                  hasEmbed={!!embedUri}
                  setEmbed={setEmbed}
                  disabled={!readyToShow}>
                  <MessageInputEmbed embedUri={embedUri} setEmbed={setEmbed} />
                </MessageInput>
              )}
            </ConversationFooter>
          )}
        </KeyboardStickyView>
      </KeyboardGestureArea>
      {!IS_INTERNAL && convo?.kind === 'group' && <GroupChatGate />}
    </InviteLinkDialogProvider>
  )
}

/**
 * Wraps the composer with optional decorations or replaces it entirely for
 * convo states where the user can't send a message. The composer stays mounted
 * in every other case - including during history fetch - so its height is
 * stable for the skeleton above.
 */
function ConversationFooter({
  convoState,
  hasAcceptOverride,
  children,
}: {
  convoState: ConvoState
  hasAcceptOverride?: boolean
  children?: React.ReactNode // message input
}) {
  if (!isConvoActive(convoState)) {
    return children
  }

  const hasItems = convoState.items.length > 0
  const isRequest =
    convoState.convo.view.status === 'request' && !hasAcceptOverride

  if (hasItems && isRequest) {
    return <ChatStatusInfo convoState={convoState} />
  }

  if (!hasItems && !convoState.isFetchingHistory) {
    return (
      <>
        <ChatEmptyPill />
        {children}
      </>
    )
  }

  return children
}

function GroupChatGate() {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const navigation = useNavigation<NavigationProp>()

  const groupChatGateDialogControl = Dialog.useDialogControl()

  const isGatedGroupChat = !ax.features.enabled(ax.features.GroupChatsEnable)

  useEffect(() => {
    if (isGatedGroupChat) {
      setTimeout(() => groupChatGateDialogControl.open())
    }
  }, [isGatedGroupChat, groupChatGateDialogControl])

  const hasBeenReleased = ax.features.enabled(
    ax.features.GroupChatsHasBeenReleased,
  )

  const isAlreadyGoingBackRef = useRef(false)
  const onGoBack = () => {
    if (isAlreadyGoingBackRef.current) return
    isAlreadyGoingBackRef.current = true
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.replace('Messages', {animation: 'pop'})
    }
  }

  return (
    <Prompt.Outer
      control={groupChatGateDialogControl}
      onClose={onGoBack}
      nativeOptions={{preventDismiss: true, preventExpansion: true}}
      testID="groupChatGateDialog">
      <Prompt.Content>
        <View style={[a.w_full, a.align_center, a.py_3xl]}>
          <Text style={{fontSize: 72}} emoji>
            🐴
          </Text>
        </View>
        <Prompt.TitleText style={[a.text_center]}>
          {hasBeenReleased ? (
            <Trans>Group chats are now available</Trans>
          ) : (
            <Trans>Group chats are not yet available</Trans>
          )}
        </Prompt.TitleText>
        <Prompt.DescriptionText style={[a.text_center]}>
          {hasBeenReleased ? (
            <Trans>Update your app to the latest version to join in!</Trans>
          ) : (
            <Trans>
              Hold your horses! This feature isn't available to you yet. Please
              check back later.
            </Trans>
          )}
        </Prompt.DescriptionText>
      </Prompt.Content>
      <Prompt.Actions>
        <Prompt.Action
          cta={l`Go Back`}
          onPress={onGoBack}
          color="primary_subtle"
        />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
