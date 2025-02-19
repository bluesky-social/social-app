import {useCallback} from 'react'
import {View} from 'react-native'
import {ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {NavigationProp} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAcceptConversation} from '#/state/queries/messages/accept-conversation'
import {precacheConvoQuery} from '#/state/queries/messages/conversation'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, tokens} from '#/alf'
import {Button, ButtonIcon, ButtonProps, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ReportDialog} from '#/components/dms/ReportDialog'
import {CircleX_Stroke2_Corner0_Rounded} from '#/components/icons/CircleX'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {PersonX_Stroke2_Corner0_Rounded as PersonXIcon} from '#/components/icons/Person'
import {KnownFollowers} from '#/components/KnownFollowers'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {ChatListItem} from './ChatListItem'

export function RequestListItem({convo}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const otherUser = convo.members.find(
    member => member.did !== currentAccount?.did,
  )

  if (!otherUser || !moderationOpts) {
    return null
  }

  const isDeletedAccount = otherUser.handle === 'missing.invalid'

  return (
    <View style={[a.relative, a.flex_1]}>
      <ChatListItem convo={convo} showMenu={false}>
        <View style={[a.pt_sm]}>
          <KnownFollowers
            profile={otherUser}
            moderationOpts={moderationOpts}
            minimal
            showIfEmpty
          />
        </View>
        {/* spacer, since you can't nest pressables */}
        <View style={[a.pt_md, a.pb_xs, a.w_full, {opacity: 0}]} aria-hidden>
          {/* Placeholder text so that it responds to the font height */}
          <Text style={[a.text_xs, a.leading_tight, a.font_bold]}>
            <Trans>Accept Request</Trans>
          </Text>
        </View>
      </ChatListItem>
      <View
        style={[
          a.absolute,
          a.pr_md,
          a.w_full,
          a.flex_row,
          a.align_center,
          a.gap_sm,
          {
            bottom: tokens.space.md,
            paddingLeft: tokens.space.lg + 52 + tokens.space.md,
          },
        ]}>
        {!isDeletedAccount ? (
          <>
            <AcceptChatButton convo={convo} />
            <RejectMenu convo={convo} profile={otherUser} />
          </>
        ) : (
          <>
            <DeleteChatButton convo={convo} />
            <View style={a.flex_1} />
          </>
        )}
      </View>
    </View>
  )
}

export function RejectMenu({
  convo,
  profile,
  size = 'tiny',
  variant = 'outline',
  color = 'secondary',
  label,
  ...props
}: Omit<ButtonProps, 'onPress' | 'children' | 'label'> & {
  label?: string
  convo: ChatBskyConvoDefs.ConvoView
  profile: ChatBskyActorDefs.ProfileViewBasic
}) {
  const {_} = useLingui()
  const shadowedProfile = useProfileShadow(profile)
  const {mutate: leaveConvo} = useLeaveConvo(convo.id, {
    onError: () => {
      Toast.show(_('Failed to delete chat'), 'xmark')
    },
  })
  const [queueBlock] = useProfileBlockMutationQueue(shadowedProfile)

  const onPressDelete = useCallback(() => {
    Toast.show(_('Chat deleted'), 'check')
    leaveConvo()
  }, [leaveConvo, _])

  const onPressBlock = useCallback(() => {
    Toast.show(_('Account blocked'), 'check')
    // block and also delete convo
    queueBlock()
    leaveConvo()
  }, [queueBlock, leaveConvo, _])

  const reportControl = useDialogControl()

  const lastMessage = ChatBskyConvoDefs.isMessageView(convo.lastMessage)
    ? convo.lastMessage
    : null

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Reject chat request`)}>
          {({props: triggerProps}) => (
            <Button
              {...triggerProps}
              {...props}
              label={triggerProps.accessibilityLabel}
              style={[a.flex_1]}
              color={color}
              variant={variant}
              size={size}>
              <ButtonText>{label || <Trans>Reject</Trans>}</ButtonText>
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              label={_(msg`Delete conversation`)}
              onPress={onPressDelete}>
              <Menu.ItemText>
                <Trans>Delete conversation</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={CircleX_Stroke2_Corner0_Rounded} />
            </Menu.Item>
            <Menu.Item label={_(msg`Block account`)} onPress={onPressBlock}>
              <Menu.ItemText>
                <Trans>Block account</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={PersonXIcon} />
            </Menu.Item>
            {/* note: last message will almost certainly be defined, since you can't
              delete messages for other people andit's impossible for a convo on this
              screen to have a message sent by you */}
            {lastMessage && (
              <Menu.Item
                label={_(msg`Report conversation`)}
                onPress={reportControl.open}>
                <Menu.ItemText>
                  <Trans>Report conversation</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={FlagIcon} />
              </Menu.Item>
            )}
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
      {lastMessage && (
        <ReportDialog
          currentScreen="list"
          params={{
            type: 'convoMessage',
            convoId: convo.id,
            message: lastMessage,
          }}
          control={reportControl}
        />
      )}
    </>
  )
}

function AcceptChatButton({convo}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: acceptConvo, isPending} = useAcceptConversation(convo.id, {
    onError: () => {
      Toast.show(_('Failed to accept chat'), 'xmark')
    },
  })

  const onPressAccept = useCallback(() => {
    acceptConvo()
    // @ts-expect-error need API update
    precacheConvoQuery(queryClient, {...convo, status: 'accepted'})
    navigation.navigate('MessagesConversation', {conversation: convo.id})
  }, [acceptConvo, navigation, convo, queryClient])

  return (
    <Button
      label={_(msg`Accept chat request`)}
      size="tiny"
      variant="solid"
      color="secondary_inverted"
      style={a.flex_1}
      onPress={onPressAccept}>
      {isPending ? (
        <ButtonIcon icon={Loader} />
      ) : (
        <ButtonText>
          <Trans>Accept</Trans>
        </ButtonText>
      )}
    </Button>
  )
}

export function DeleteChatButton({
  convo,
  size = 'tiny',
  variant = 'outline',
  color = 'secondary',
  label,
  popOnLeave = false,
  ...props
}: Omit<ButtonProps, 'onPress' | 'children' | 'label'> & {
  label?: string
  convo: ChatBskyConvoDefs.ConvoView
  popOnLeave?: boolean
}) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: leaveConvo} = useLeaveConvo(convo.id, {
    onMutate: () => {
      if (popOnLeave) {
        navigation.dispatch(
          StackActions.replace('Messages', isNative ? {animation: 'pop'} : {}),
        )
      }
    },
    onError: () => {
      Toast.show(_('Failed to delete chat'), 'xmark')
    },
  })

  const onPressDelete = useCallback(() => {
    Toast.show(_('Chat deleted'), 'check')
    leaveConvo()
  }, [leaveConvo, _])

  return (
    <Button
      label={label || _(msg`Delete chat`)}
      size={size}
      variant={variant}
      color={color}
      style={a.flex_1}
      onPress={onPressDelete}
      {...props}>
      <ButtonText>{label || <Trans>Delete chat</Trans>}</ButtonText>
    </Button>
  )
}
