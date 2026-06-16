import {useState} from 'react'
import {View} from 'react-native'
import {
  ChatBskyGroupApproveJoinRequest,
  type ChatBskyGroupListJoinRequests,
  ChatBskyGroupRejectJoinRequest,
} from '@atproto/api'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {type InfiniteData, useQueryClient} from '@tanstack/react-query'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {ConvoProvider, useConvo} from '#/state/messages/convo'
import {ConvoStatus} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useJoinRequestMutation} from '#/state/queries/messages/join-requests'
import {
  createListJoinRequestsQueryKey,
  useListJoinRequestsQuery,
} from '#/state/queries/messages/list-join-requests'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type ConvoWithDetails} from '#/components/dms/util'
import {Error} from '#/components/Error'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotate'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {KnownFollowers} from '#/components/KnownFollowers'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'
import {InviteLinkDialog} from './components/InviteLinkDialog'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesJoinRequests'
>

export function MessagesJoinRequestsScreen(props: Props) {
  const {t: l} = useLingui()
  const aaCopy = useAgeAssuranceCopy()
  return (
    <AgeRestrictedScreen
      screenTitle={l`Requests to join`}
      infoText={aaCopy.chatsInfoText}>
      <MessagesJoinRequestsScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

function MessagesJoinRequestsScreenInner({route}: Props) {
  const convoId = route.params.conversation

  return (
    <Layout.Screen>
      <ConvoProvider key={convoId} convoId={convoId}>
        <JoinRequestsInner />
      </ConvoProvider>
    </Layout.Screen>
  )
}

function JoinRequestsInner() {
  const {t: l} = useLingui()
  const convoState = useConvo()
  const navigation = useNavigation<NavigationProp>()

  if (convoState.status === ConvoStatus.Error) {
    return (
      <>
        <Header />
        <Error
          title={l`Something went wrong`}
          message={l`We couldn’t load this conversation’s join requests`}
          onRetry={() => convoState.error.retry()}
        />
      </>
    )
  }

  if (!convoState.convo) {
    return (
      <>
        <Header />
        <View style={[a.flex_1, a.align_center, a.justify_center]}>
          <Loader size="xl" />
        </View>
      </>
    )
  }

  if (convoState.convo.kind !== 'group') {
    return (
      <Error
        title={l`Wrong kind of conversation`}
        message={l`This screen is only available for group conversations.`}
        onGoBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.replace('Messages', {animation: 'pop'})
          }
        }}
      />
    )
  }

  return <JoinRequestsList convo={convoState.convo} />
}

function JoinRequestsList({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const moderationOpts = useModerationOpts()
  const bottomBarOffset = useBottomBarOffset()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const queryClient = useQueryClient()
  const inviteLinkControl = Dialog.useDialogControl()

  const convoId = convo.view.id

  const getRemainingRequestCount = () => {
    const data = queryClient.getQueryData<
      InfiniteData<ChatBskyGroupListJoinRequests.OutputSchema>
    >(createListJoinRequestsQueryKey({convoId}))
    return data?.pages.reduce((sum, page) => sum + page.requests.length, 0) ?? 0
  }

  const [isPTRing, setIsPTRing] = useState(false)
  const [footerHeight, setFooterHeight] = useState(0)

  const owner = convo.primaryMember
  const isOwner = !!owner && owner.did === currentAccount?.did

  const {
    data: joinRequestsData,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useListJoinRequestsQuery({
    convoId: convo.view.id,
  })

  const items =
    joinRequestsData?.pages.flatMap(page =>
      page.requests.map(request => request.requestedBy),
    ) ?? []
  const requestCount =
    joinRequestsData?.pages.reduce(
      (sum, page) => sum + page.requests.length,
      0,
    ) ?? 0

  const {mutate: approveJoinRequest, isPending: isApprovePending} =
    useJoinRequestMutation('approve', convoId, {
      onSuccess: () => {
        ax.metric('groupchat:owner:joinRequest:accept', {convoId})
        Toast.show(l`Request approved.`)
        if (getRemainingRequestCount() < 1) {
          navigation.replace('MessagesConversationSettings', {
            conversation: convoId,
          })
        }
      },
      onError: error => {
        let errorMessage = l`Failed to accept join request`
        if (isNetworkError(error)) {
          errorMessage = l`A network error occurred. Please check your internet connection.`
        } else if (
          error instanceof ChatBskyGroupApproveJoinRequest.InvalidConvoError
        ) {
          errorMessage = l`Conversation not found.`
        } else if (
          error instanceof ChatBskyGroupApproveJoinRequest.InsufficientRoleError
        ) {
          errorMessage = l`Only admins can accept join requests.`
        } else if (
          error instanceof
          ChatBskyGroupApproveJoinRequest.MemberLimitReachedError
        ) {
          errorMessage = l`The member limit has been reached.`
        }
        Toast.show(errorMessage, {type: 'error'})
      },
    })

  const {mutate: rejectJoinRequest, isPending: isRejectPending} =
    useJoinRequestMutation('reject', convoId, {
      onSuccess: () => {
        ax.metric('groupchat:owner:joinRequest:reject', {convoId})
        Toast.show(l`Request ignored.`)
        if (getRemainingRequestCount() < 1) {
          navigation.replace('MessagesConversationSettings', {
            conversation: convoId,
          })
        }
      },
      onError: error => {
        let errorMessage = l`Failed to ignore join request`
        if (isNetworkError(error)) {
          errorMessage = l`A network error occurred. Please check your internet connection.`
        } else if (
          error instanceof ChatBskyGroupRejectJoinRequest.InvalidConvoError
        ) {
          errorMessage = l`Conversation not found.`
        } else if (
          error instanceof ChatBskyGroupRejectJoinRequest.InsufficientRoleError
        ) {
          errorMessage = l`Only admins can ignore join requests.`
        }
        Toast.show(errorMessage, {type: 'error'})
      },
    })

  const isMutating = isApprovePending || isRejectPending

  const renderItem = ({item}: {item: bsky.profile.AnyProfileView}) => {
    if (!moderationOpts) return null
    return (
      <View style={[a.relative, a.flex_1, a.p_lg]}>
        <View style={[a.flex_row, a.align_start, a.gap_md]}>
          <ProfileCard.Link profile={item}>
            <ProfileCard.Avatar
              profile={item}
              moderationOpts={moderationOpts}
              size={44}
              disabledPreview
            />
          </ProfileCard.Link>
          <View>
            <ProfileCard.Name profile={item} moderationOpts={moderationOpts} />
            <ProfileCard.Handle profile={item} />
            <View style={[a.mt_xs]}>
              <KnownFollowers
                profile={item}
                moderationOpts={moderationOpts}
                minimal
                showIfEmpty
              />
            </View>
            <View style={[a.flex_row, a.align_center, a.gap_sm, a.mt_md]}>
              <AcceptButton
                disabled={isMutating}
                onPress={() => approveJoinRequest({member: item.did})}
              />
              <RejectButton
                disabled={isMutating}
                onPress={() => rejectJoinRequest({member: item.did})}
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  const footer = (
    <View
      onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}
      style={[
        a.absolute,
        a.left_0,
        a.right_0,
        {bottom: 0},
        a.px_xl,
        a.border_t,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        {
          paddingTop: a.py_lg.paddingTop,
          paddingBottom: a.py_lg.paddingBottom + bottomBarOffset,
        },
      ]}>
      <Button
        label={l`Edit invite link`}
        size="large"
        color="primary"
        onPress={() => inviteLinkControl.open()}
        style={[a.w_full]}>
        <ButtonText>
          <Trans context="button">Edit invite link</Trans>
        </ButtonText>
      </Button>
    </View>
  )

  const onEndReached = async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more join requests', {message: err})
    }
  }

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh group chat requests', {message: err})
    }
    setIsPTRing(false)
  }

  if (isError) {
    return (
      <>
        <Header count={requestCount} hasMoreRequests={hasNextPage} />
        <View
          style={[
            a.flex_1,
            a.align_center,
            a.justify_center,
            a.gap_sm,
            a.p_lg,
          ]}>
          <ErrorIcon size="3xl" fill={t.atoms.text_contrast_high.color} />
          <Text
            style={[
              a.leading_snug,
              a.text_center,
              a.px_lg,
              a.text_md,
              t.atoms.text_contrast_high,
            ]}>
            <Trans>Unable to fetch join requests.</Trans>
          </Text>
          <Button
            color="primary"
            label={l`Press to retry`}
            onPress={() => void onRefresh()}
            disabled={isPTRing}
            size="large"
            style={[a.mt_md]}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
            <ButtonIcon icon={isPTRing ? Loader : RetryIcon} />
          </Button>
        </View>
      </>
    )
  }

  const showFooter = isOwner

  return (
    <>
      <Header count={requestCount} hasMoreRequests={hasNextPage} />
      <List
        data={items}
        keyExtractor={(item: bsky.profile.AnyProfileView) => item.did}
        renderItem={renderItem}
        ListEmptyComponent={
          isPending ? (
            <View
              style={[a.flex_1, a.align_center, a.justify_center, a.py_4xl]}>
              <Loader size="xl" />
            </View>
          ) : null
        }
        contentContainerStyle={
          showFooter ? {paddingBottom: footerHeight} : undefined
        }
        scrollIndicatorInsets={showFooter ? {bottom: footerHeight} : undefined}
        refreshing={isPTRing}
        onEndReached={() => void onEndReached()}
        onRefresh={() => void onRefresh()}
        keyboardDismissMode="on-drag"
        sideBorders={false}
        desktopFixedHeight
      />
      {showFooter ? footer : null}
      {owner && moderationOpts && (
        <InviteLinkDialog
          convo={convo}
          control={inviteLinkControl}
          owner={owner}
          isOwner={isOwner}
          moderationOpts={moderationOpts}
        />
      )}
    </>
  )
}

function Header({
  count,
  hasMoreRequests,
}: {
  count?: number
  hasMoreRequests?: boolean
}) {
  return (
    <Layout.Header.Outer>
      <Layout.Header.BackButton />
      <Layout.Header.Content>
        <Layout.Header.TitleText>
          {count === undefined ? (
            <Trans>Requests to join</Trans>
          ) : hasMoreRequests ? (
            <Plural
              value={count}
              other="#+ requests to join"
              comment="Displayed when there are more requests to join a group chat than have been loaded"
            />
          ) : (
            <Plural
              value={count}
              _0="No requests to join"
              one="# request to join"
              other="# requests to join"
            />
          )}
        </Layout.Header.TitleText>
      </Layout.Header.Content>
      <Layout.Header.Slot />
    </Layout.Header.Outer>
  )
}

function AcceptButton({
  disabled,
  onPress,
}: {
  disabled?: boolean
  onPress: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Button
      label={l`Accept join request`}
      size="small"
      color="primary"
      disabled={disabled}
      onPress={onPress}>
      <ButtonText>
        <Trans comment="Accept a request to join a chat" context="button">
          Accept
        </Trans>
      </ButtonText>
    </Button>
  )
}

function RejectButton({
  disabled,
  onPress,
}: {
  disabled?: boolean
  onPress: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Button
      label={l`Reject join request`}
      size="small"
      color="secondary"
      disabled={disabled}
      onPress={onPress}>
      <ButtonText>
        <Trans comment="Reject a request to join a chat" context="button">
          Reject
        </Trans>
      </ButtonText>
    </Button>
  )
}
