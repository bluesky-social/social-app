import {View} from 'react-native'
import {
  ChatBskyGroupRequestJoin,
  ChatBskyGroupWithdrawJoinRequest,
  moderateProfile,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {isNetworkError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useJoinLinkPreviewsQuery} from '#/state/queries/join-links'
import {useRequestJoinGroupChat} from '#/state/queries/messages/request-join-group-chat'
import {useWithdrawJoinGroupChatRequest} from '#/state/queries/messages/withdraw-join-group-chat'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {
  Button,
  type ButtonColor,
  ButtonIcon,
  ButtonText,
} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon} from '#/components/icons/ArrowBoxRight'
import {ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon} from '#/components/icons/ChainLink'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {ProfileBadges} from '../ProfileBadges'

export function GroupChatJoinDialog() {
  const {groupChatJoinDialogControl, groupChatJoinState} = useIntentDialogs()

  return (
    <Dialog.Outer
      control={groupChatJoinDialogControl}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <GroupChatJoinDialogInner code={groupChatJoinState?.code} />
    </Dialog.Outer>
  )
}

function GroupChatJoinDialogInner({code}: {code?: string}) {
  const {t: l} = useLingui()

  return (
    <Dialog.ScrollableInner
      label={l`Join group chat`}
      style={[web({maxWidth: 400, borderRadius: 36})]}>
      <View style={[a.gap_2xl, a.align_center]}>
        <GroupChatJoinDialogContent code={code} />
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function GroupChatJoinDialogContent({code}: {code?: string}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {groupChatJoinDialogControl: control} = useIntentDialogs()
  const {hasSession} = useSession()
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()

  const {data, error, isLoading} = useJoinLinkPreviewsQuery({
    codes: code ? [code] : undefined,
    hasSession,
  })

  const {mutate: joinGroupChat, isPending: isJoinPending} =
    useRequestJoinGroupChat({
      onSuccess: data => {
        switch (data.status) {
          case 'pending':
            control.close(() => {
              Toast.show(
                l`Access requested! The group owner will review your request.`,
              )
            })
            break
          case 'joined': {
            if (data.convo && data.convo.id) {
              control.close(() => {
                Toast.show(l`Successfully joined the group chat!`)
                navigation.navigate('MessagesConversation', {
                  conversation: data.convo!.id,
                })
              })
            } else {
              logger.warn('Request to join group chat returned no convo ID', {
                status: data.status,
                convoId: data.convo?.id,
              })
            }
            break
          }
        }
      },
      onError: error => {
        let errorMessage = l`Failed to join the group chat. Please try again.`
        if (isNetworkError(error)) {
          errorMessage = l`There was a problem with your internet connection, please try again`
        } else if (error instanceof ChatBskyGroupRequestJoin.ConvoLockedError) {
          errorMessage = l`This conversation is locked.`
        } else if (
          error instanceof ChatBskyGroupRequestJoin.FollowRequiredError
        ) {
          errorMessage = l`Only followers can join this group chat.`
        } else if (error instanceof ChatBskyGroupRequestJoin.InvalidCodeError) {
          errorMessage = l`Invalid group chat code.`
        } else if (
          error instanceof ChatBskyGroupRequestJoin.LinkDisabledError
        ) {
          errorMessage = l`This invite link has been disabled.`
        } else if (
          error instanceof ChatBskyGroupRequestJoin.MemberLimitReachedError
        ) {
          errorMessage = l`The member limit has been reached.`
        } else if (error instanceof ChatBskyGroupRequestJoin.UserKickedError) {
          errorMessage = l`You have been removed from this group.`
        }
        Toast.show(errorMessage)
      },
    })

  const {mutate: withdrawRequest, isPending: isWithdrawPending} =
    useWithdrawJoinGroupChatRequest({
      onSuccess: () => {
        control.close(() => {
          Toast.show(l`Join request rescinded.`)
        })
      },
      onError: error => {
        let errorMessage = l`Failed to rescind your request. Please try again.`
        if (isNetworkError(error)) {
          errorMessage = l`There was a problem with your internet connection, please try again`
        } else if (
          error instanceof
          ChatBskyGroupWithdrawJoinRequest.InvalidJoinRequestError
        ) {
          errorMessage = l`Invalid rescind request.`
        }
        Toast.show(errorMessage)
      },
    })

  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  const handleJoin = () => {
    if (!code) return
    joinGroupChat({code})
  }

  const handleWithdraw = () => {
    if (!convoId) return
    withdrawRequest({convoId})
  }

  // Fallback if the prefetch exceeds the timeout
  if (isLoading || !data || !moderationOpts) {
    return (
      <View style={[a.p_2xl]}>
        <Loader size="xl" />
      </View>
    )
  }

  if (error) {
    return (
      <>
        <ChainLinkBrokenIcon fill={t.palette.primary_500} size="3xl" />
        <Text
          style={[a.text_center, a.text_lg, a.font_semi_bold, t.atoms.text]}>
          <Trans>This invite link is invalid</Trans>
        </Text>
        <Button
          label={l`Close this dialog`}
          accessibilityHint={l`Close this dialog`}
          onPress={() => control.close()}
          color="primary"
          size="large"
          style={[a.w_full]}>
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      </>
    )
  }

  const joinLinkPreview = data.joinLinkPreviews[0]

  if (!joinLinkPreview) {
    return (
      <>
        <View style={[a.py_lg, a.align_center]}>
          <View style={[a.gap_sm, a.align_center, a.mt_lg]}>
            <WarningIcon size="3xl" fill={t.atoms.text_contrast_high.color} />
            <Text
              style={[
                a.mb_2xs,
                a.text_center,
                a.text_sm,
                a.font_medium,
                t.atoms.text_contrast_high,
              ]}>
              <Trans>Chat invite link no longer available</Trans>
            </Text>
          </View>
        </View>
        <Button
          testID="joinButton"
          onPress={() => control.close()}
          label={l`Close this dialog`}
          accessibilityHint={l`Close this dialog`}
          size="large"
          color="secondary"
          style={[a.w_full]}>
          <ButtonText>{l`Close`}</ButtonText>
        </Button>
      </>
    )
  }

  const convoId = joinLinkPreview.convo?.id
  const isFollowing = joinLinkPreview.owner.viewer?.following ?? false
  const hasRequested = !convoId && joinLinkPreview.viewer?.requestedAt != null

  let canJoin = true
  let ButtonIconImage = isJoinPending || isWithdrawPending ? Loader : JoinIcon
  let buttonText = joinLinkPreview.requireApproval
    ? l`Request to join`
    : l`Join`
  let buttonColor: ButtonColor = 'primary'
  if (joinLinkPreview.enabledStatus !== 'enabled') {
    canJoin = false
    ButtonIconImage = WarningIcon
    buttonText = l`Chat invite link no longer available`
    buttonColor = 'secondary'
  } else if (joinLinkPreview.memberCount >= joinLinkPreview.memberLimit) {
    canJoin = false
    ButtonIconImage = HandIcon
    buttonText = l`This chat is full`
    buttonColor = 'secondary'
  } else if (joinLinkPreview.joinRule === 'followedByOwner' && !isFollowing) {
    canJoin = false
    ButtonIconImage = HandIcon
    buttonText = l`Only people the chat owner follows can join`
    buttonColor = 'secondary'
  } else if (hasRequested) {
    ButtonIconImage = XIcon
    buttonText = l`Rescind request`
    buttonColor = 'secondary'
  }

  return (
    <>
      <View style={[a.py_lg, a.align_center]}>
        <AvatarBubbles
          profiles={[
            joinLinkPreview.owner,
            ...Array(joinLinkPreview.memberCount - 1).fill(undefined),
          ]}
          self
          size={135}
        />
        <View style={[a.gap_sm, a.align_center, a.mt_lg]}>
          <View>
            <Text
              style={[
                a.mb_2xs,
                a.text_center,
                a.text_sm,
                a.font_medium,
                t.atoms.text_contrast_high,
              ]}>
              <Trans>Group chat</Trans>
            </Text>
            <Text
              style={[a.text_center, a.text_3xl, a.font_bold, t.atoms.text]}>
              {joinLinkPreview.name}
            </Text>
          </View>
          <View style={[a.flex_row, a.align_center]}>
            <Text
              style={[a.text_center, a.text_xs, a.leading_snug, t.atoms.text]}>
              <Trans comment="The number of active group chat members out of the total number allowed.">
                {joinLinkPreview.memberCount}/{joinLinkPreview.memberLimit}{' '}
                members
              </Trans>
            </Text>
            <View style={[a.flex_row, a.ml_md]}>
              <PersonGroupIcon
                size="xs"
                style={[a.mr_xs, t.atoms.text, {marginTop: -2}]}
              />
            </View>
            <Text
              style={[a.text_center, a.text_xs, a.leading_snug, t.atoms.text]}>
              {joinLinkPreview.joinRule === 'followedByOwner'
                ? l`Followers can join`
                : l`Anyone can join`}
            </Text>
          </View>
          <View>
            <View
              style={[a.flex_row, a.gap_xs, a.align_center, a.justify_center]}>
              <Text
                style={[
                  a.mb_2xs,
                  a.text_center,
                  a.text_sm,
                  a.leading_snug,
                  a.font_semi_bold,
                  t.atoms.text,
                ]}>
                By{' '}
                <InlineLinkText
                  label={`@${joinLinkPreview.owner.handle}`}
                  to={makeProfileLink(joinLinkPreview.owner)}
                  style={[
                    a.mb_2xs,
                    a.text_sm,
                    a.font_semi_bold,
                    t.atoms.text,
                    interacted && {
                      ...web({
                        outline: 0,
                        textDecorationLine: 'underline',
                        textDecorationColor: t.palette.contrast_1000,
                      }),
                    },
                  ]}
                  {...web({
                    onMouseEnter: () => {
                      onInteract()
                    },
                    onMouseLeave: () => {
                      onInteractOut()
                    },
                  })}>
                  {createSanitizedDisplayName(
                    joinLinkPreview.owner,
                    true,
                    moderateProfile(joinLinkPreview.owner, moderationOpts).ui(
                      'displayName',
                    ),
                  )}
                </InlineLinkText>
              </Text>
              <ProfileBadges
                profile={data.joinLinkPreviews[0].owner}
                size="sm"
                style={{marginTop: -3}}
              />
            </View>
            <Text
              style={[
                a.text_center,
                a.text_xs,
                a.leading_snug,
                t.atoms.text_contrast_high,
              ]}>
              {sanitizeHandle(joinLinkPreview.owner.handle, '@')}
            </Text>
          </View>
        </View>
      </View>
      {convoId ? (
        <Button
          testID="openButton"
          onPress={() => {
            control.close(() => {
              navigation.navigate('MessagesConversation', {
                conversation: convoId,
              })
            })
          }}
          label={l`Open group chat`}
          accessibilityHint={l`Open this group chat`}
          size="large"
          color="primary"
          disabled={!code}
          style={[a.w_full]}>
          <ButtonText>Open chat</ButtonText>
          <ButtonIcon icon={ArrowRightIcon} />
        </Button>
      ) : (
        <Button
          testID="joinButton"
          onPress={hasRequested ? handleWithdraw : handleJoin}
          label={
            joinLinkPreview.requireApproval
              ? l`Request access to group chat`
              : l`Join group chat`
          }
          accessibilityHint={
            joinLinkPreview.requireApproval
              ? l`Request access to join this group chat`
              : l`Join this group chat`
          }
          size="large"
          color={buttonColor}
          disabled={isJoinPending || isWithdrawPending || !code || !canJoin}
          style={[a.w_full]}>
          <ButtonIcon icon={ButtonIconImage} />
          <ButtonText>{buttonText}</ButtonText>
        </Button>
      )}
    </>
  )
}
