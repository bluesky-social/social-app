import {useCallback, useEffect, useMemo, useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  type AppBskyActorDefs,
  moderateProfile,
  type ModerationDecision,
} from '@atproto/api'
import {
  ScrollEdgeEffect,
  ScrollEdgeEffectProvider,
} from '@bsky.app/expo-scroll-edge-effect'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
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
import {type Shadow, useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useEmail} from '#/state/email-verification'
import {ConvoProvider, isConvoActive, useConvo} from '#/state/messages/convo'
import {ConvoStatus} from '#/state/messages/convo/types'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {MessagesList} from '#/screens/Messages/components/MessagesList'
import {atoms as a, useTheme, web} from '#/alf'
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
import {Loader} from '#/components/Loader'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>

export function MessagesConversationScreen(props: Props) {
  const {_} = useLingui()
  const aaCopy = useAgeAssuranceCopy()
  return (
    <AgeRestrictedScreen
      screenTitle={_(msg`Conversation`)}
      infoText={aaCopy.chatsInfoText}>
      <MessagesConversationScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

export function MessagesConversationScreenInner({route}: Props) {
  const setMinimalShellMode = useSetMinimalShellMode()

  const convoId = route.params.conversation
  const {setCurrentConvoId} = useCurrentConvoId()

  useFocusEffect(
    useCallback(() => {
      setCurrentConvoId(convoId)
      setMinimalShellMode(true)

      return () => {
        setCurrentConvoId(undefined)
        setMinimalShellMode(false)
      }
    }, [convoId, setCurrentConvoId, setMinimalShellMode]),
  )

  return (
    <Layout.Screen
      testID="convoScreen"
      noInsetTop={IS_LIQUID_GLASS}
      style={web([{minHeight: 0}, a.flex_1])}>
      <ScrollEdgeEffectProvider>
        <ConvoProvider key={convoId} convoId={convoId}>
          <Inner />
        </ConvoProvider>
      </ScrollEdgeEffectProvider>
    </Layout.Screen>
  )
}

function Inner() {
  const t = useTheme()
  const convoState = useConvo()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const isFocused = useIsFocused()
  const {top: topInset} = useSafeAreaInsets()

  const convo = convoState.convo
    ? parseConvoView(convoState.convo, currentAccount?.did)
    : null

  const moderationOpts = useModerationOpts()
  const {data: recipientUnshadowed} = useProfileQuery({
    did: convoState.getPrimaryMember?.()?.did,
  })
  const recipient = useMaybeProfileShadow(recipientUnshadowed)

  const moderation = useMemo(() => {
    if (!recipient || !moderationOpts) return null
    return moderateProfile(recipient, moderationOpts)
  }, [recipient, moderationOpts])

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
          {moderation ? (
            <MessagesListHeader
              convo={convo}
              profile={recipient}
              moderation={moderation}
            />
          ) : (
            <MessagesListHeader convo={convo} />
          )}
        </Layout.Center>
        <Error
          title={_(msg`Something went wrong`)}
          message={_(msg`We couldn't load this conversation`)}
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
          {moderation ? (
            <MessagesListHeader
              convo={convo}
              profile={recipient}
              moderation={moderation}
            />
          ) : (
            <MessagesListHeader convo={convo} />
          )}
        </View>
      )}
      <View style={[a.flex_1]}>
        <InnerReady
          moderation={moderation}
          recipient={recipient}
          hasScrolled={hasScrolled}
          setHasScrolled={setHasScrolled}
          convo={convo}
          isActive={isConvoActive(convoState)}
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
  moderation,
  recipient,
  hasScrolled,
  setHasScrolled,
  convo,
  isActive,
  hasMessages,
}: {
  moderation: ModerationDecision | null
  recipient: Shadow<AppBskyActorDefs.ProfileViewDetailed> | undefined
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  convo: ConvoWithDetails | null
  isActive: boolean
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

  const header = (
    <MessagesListHeader
      convo={convo}
      profile={recipient}
      moderation={moderation}
    />
  )

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
          blocked={moderation?.blocked}
          hasAcceptOverride={!!params.accept}
          transparentHeaderHeight={IS_LIQUID_GLASS ? headerHeight : 0}
          footer={
            moderation && recipient && convo ? (
              <MessagesListBlockedFooter
                recipient={recipient}
                convoId={convo.view.id}
                hasMessages={hasMessages}
                moderation={moderation}
              />
            ) : null
          }
        />
      )}
    </>
  )
}
