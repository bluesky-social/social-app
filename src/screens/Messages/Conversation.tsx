import {useCallback, useEffect, useMemo, useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  ScrollEdgeEffect,
  ScrollEdgeEffectProvider,
} from '@bsky.app/expo-scroll-edge-effect'
import {moderateProfile} from '@bsky.app/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'
import {
  type RouteProp,
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useViewportZoomLock} from '#/lib/hooks/useViewportZoomLock'
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
import {useMarkJoinRequestsRead} from '#/state/queries/messages/mark-join-request-read'
import {useSession} from '#/state/session'
import {MessagesList} from '#/screens/Messages/components/MessagesList'
import {atoms as a, web} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {MessagesListBlockedFooter} from '#/components/dms/MessagesListBlockedFooter'
import {MessagesListHeader} from '#/components/dms/MessagesListHeader'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {Error} from '#/components/Error'
import * as Layout from '#/components/Layout'
import {IS_LIQUID_GLASS} from '#/env'
import {chat} from '#/lexicons'
import {isType, toLex} from '#/types/bsky'
import {ChatDisabled} from './components/ChatDisabled'
import {ChatEnded} from './components/ChatEnded'
import {ChatLocked} from './components/ChatLocked'
import {RequestStatus} from './components/RequestStatus'

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
  const {top: topInset} = useSafeAreaInsets()
  const {data: convoData} = useConvoQuery({convoId})

  useViewportZoomLock({enabled: isFocused})

  const convo = convoData
    ? parseConvoView(convoData, currentAccount?.did)
    : null

  const [hasScrolled, setHasScrolled] = useState(false)

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
        />
      </>
    )
  }

  return (
    <Layout.Center style={[a.flex_1]}>
      <View style={[a.flex_1]}>
        <InnerReady
          convo={convo}
          hasScrolled={hasScrolled}
          setHasScrolled={setHasScrolled}
          isActive={isConvoActive(convoState)}
          isDisabled={convoState.status === ConvoStatus.Disabled}
        />
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
}: {
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  convo: ConvoWithDetails | null
  isActive: boolean
  isDisabled: boolean
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

  const unreadRequestCount =
    convo?.kind === 'group' &&
    isType(chat.bsky.convo.defs.groupConvo, convo.view.kind)
      ? (convo.view.kind.unreadJoinRequestCount ?? 0)
      : 0
  const {mutate: markJoinRequestsRead} = useMarkJoinRequestsRead(convo?.view.id)

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
    // TODO(phase4): drop toLex once useMaybeProfileShadow emits #/lexicons views
    return moderateProfile(toLex(primaryMember), moderationOpts)
  }, [primaryMember, moderationOpts])

  const header = <MessagesListHeader convo={convo} />

  let footer: React.ReactNode = null
  if (isDisabled) {
    footer = <ChatDisabled />
  } else if (
    convo &&
    primaryMember &&
    primaryMemberModeration &&
    (convo.kind === 'group'
      ? primaryMemberModeration?.blockCause?.type === 'blocking'
      : primaryMemberModeration?.blocked)
  ) {
    footer = (
      <MessagesListBlockedFooter
        recipient={primaryMember}
        convoId={convo.view.id}
        isGroup={convo.kind === 'group'}
        moderation={primaryMemberModeration}
      />
    )
  } else if (convo?.kind === 'group') {
    if (convo.details.lockStatus === 'locked') {
      footer = <ChatLocked convo={convo} />
    } else if (convo.details.lockStatus === 'locked-permanently') {
      footer = <ChatEnded convo={convo} />
    }
  }

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
        <View onLayout={onHeaderLayout}>{header}</View>
      )}

      {isActive && convo?.kind === 'group' && unreadRequestCount > 0 ? (
        <RequestStatus
          top={headerHeight}
          count={unreadRequestCount}
          onDismiss={() => {
            markJoinRequestsRead()
          }}
          onPress={() => {
            markJoinRequestsRead()
            navigation.navigate('MessagesJoinRequests', {
              conversation: convo.view.id,
            })
          }}
        />
      ) : null}

      {isActive && (
        <MessagesList
          hasScrolled={hasScrolled}
          setHasScrolled={setHasScrolled}
          hasAcceptOverride={!!params.accept}
          transparentHeaderHeight={IS_LIQUID_GLASS ? headerHeight : 0}
          footer={footer}
        />
      )}
    </>
  )
}
