import {useCallback, useEffect, useMemo, useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {moderateProfile} from '@atproto/api'
import {
  ScrollEdgeEffect,
  ScrollEdgeEffectProvider,
} from '@bsky.app/expo-scroll-edge-effect'
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

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useEmail} from '#/state/email-verification'
import {ConvoProvider, isConvoActive, useConvo} from '#/state/messages/convo'
import {ConvoStatus} from '#/state/messages/convo/types'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useConvoQuery} from '#/state/queries/messages/conversation'
import {useSession} from '#/state/session'
import {MessagesList} from '#/screens/Messages/components/MessagesList'
import {atoms as a, useTheme, web} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import * as Dialog from '#/components/Dialog'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {MessagesListBlockedFooter} from '#/components/dms/MessagesListBlockedFooter'
import {MessagesListHeader} from '#/components/dms/MessagesListHeader'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {Error} from '#/components/Error'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'
import {ChatDisabled} from './components/ChatDisabled'

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
  const t = useTheme()
  const convoState = useConvo()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const isFocused = useIsFocused()
  const {top: topInset} = useSafeAreaInsets()
  const {data: convoData} = useConvoQuery({convoId})

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
        <Layout.Center
          style={[a.w_full, IS_LIQUID_GLASS && {paddingTop: topInset}]}>
          <MessagesListHeader convo={convo} />
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
      {!readyToShow && (
        <View style={IS_LIQUID_GLASS && {paddingTop: topInset}}>
          <MessagesListHeader convo={convo} />
        </View>
      )}
      <View style={[a.flex_1]}>
        <InnerReady
          convo={convo}
          hasScrolled={hasScrolled}
          setHasScrolled={setHasScrolled}
          isActive={isConvoActive(convoState)}
          isDisabled={convoState.status === ConvoStatus.Disabled}
          hasMessages={isConvoActive(convoState) && convoState.items.length > 0}
        />
        {!readyToShow && (
          <View
            style={[
              a.absolute,
              a.z_10,
              a.w_full,
              a.h_full,
              a.justify_center,
              a.align_center,
              t.atoms.bg,
            ]}>
            <View style={[{marginBottom: 75}]}>
              <Loader size="xl" />
            </View>
          </View>
        )}
      </View>
    </Layout.Center>
  )
}

function InnerReady({
  hasScrolled,
  setHasScrolled,
  convo,
  isActive,
  isDisabled,
  hasMessages,
}: {
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  convo: ConvoWithDetails | null
  isActive: boolean
  isDisabled: boolean
  hasMessages: boolean
}) {
  const navigation = useNavigation<NavigationProp>()
  const {top: topInset} = useSafeAreaInsets()
  const [headerHeight, setHeaderHeight] = useState(0)
  const onHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height)
  }
  const {params} =
    useRoute<RouteProp<CommonNavigatorParams, 'MessagesConversation'>>()
  const {needsEmailVerification} = useEmail()
  const emailDialogControl = useEmailDialogControl()

  /**
   * Must be non-reactive, otherwise the update to open the global dialog will
   * cause a re-render loop.
   */
  const maybeBlockForEmailVerification = useNonReactiveCallback(() => {
    if (needsEmailVerification) {
      /*
       * HACKFIX
       *
       * Load bearing timeout, to bump this state update until the after the
       * `navigator.addListener('state')` handler closes elements from
       * `shell/index.*.tsx`  - sfn & esb
       */
      setTimeout(() =>
        emailDialogControl.open({
          id: EmailDialogScreenID.Verify,
          instructions: [
            <Trans key="pre-compose">
              Before you can message another user, you must first verify your
              email.
            </Trans>,
          ],
          onCloseWithoutVerifying: () => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              navigation.navigate('Messages', {animation: 'pop'})
            }
          },
        }),
      )
    }
  })

  useEffect(() => {
    maybeBlockForEmailVerification()
  }, [maybeBlockForEmailVerification])

  const primaryMember = useMaybeProfileShadow(convo?.primaryMember)
  const moderationOpts = useModerationOpts()
  const primaryMemberModeration = useMemo(() => {
    if (!primaryMember || !moderationOpts) return null
    return moderateProfile(primaryMember, moderationOpts)
  }, [primaryMember, moderationOpts])

  const header = <MessagesListHeader convo={convo} />

  return (
    <>
      {IS_LIQUID_GLASS ? (
        <ScrollEdgeEffect
          edge="top"
          style={[a.absolute, a.w_full, a.z_10, {paddingTop: topInset}]}
          onLayout={onHeaderLayout}>
          {header}
        </ScrollEdgeEffect>
      ) : (
        header
      )}
      {isActive && (
        <MessagesList
          hasScrolled={hasScrolled}
          setHasScrolled={setHasScrolled}
          hasAcceptOverride={!!params.accept}
          transparentHeaderHeight={IS_LIQUID_GLASS ? headerHeight : 0}
          footer={
            isDisabled ? (
              <ChatDisabled />
            ) : convo && primaryMember && primaryMemberModeration?.blocked ? (
              <MessagesListBlockedFooter
                recipient={primaryMember}
                convoId={convo.view.id}
                hasMessages={hasMessages}
                moderation={primaryMemberModeration}
              />
            ) : null
          }
        />
      )}

      {convo?.kind === 'group' && <GroupChatGate />}
    </>
  )
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

  const onGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.replace('Messages', {animation: 'pop'})
    }
  }

  return (
    <Prompt.Outer
      control={groupChatGateDialogControl}
      nativeOptions={{preventDismiss: true, preventExpansion: true}}
      testID="groupChatGateDialog">
      <Prompt.Content>
        <View style={[a.w_full, a.align_center, a.py_2xl]}>
          <Text style={{fontSize: 48}} emoji>
            🐴
          </Text>
        </View>
        <Prompt.TitleText>
          {hasBeenReleased ? (
            <Trans>Group chats are now available</Trans>
          ) : (
            <Trans>Group chats are not yet available</Trans>
          )}
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          {hasBeenReleased ? (
            <Trans>Update your app to the latest version to join in!</Trans>
          ) : (
            <Trans>
              This feature isn't available to you yet. Please check back later.
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
