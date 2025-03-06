import {useCallback} from 'react'
import {ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useAcceptConversation} from '#/state/queries/messages/accept-conversation'
import {precacheConvoQuery} from '#/state/queries/messages/conversation'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonProps, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ReportDialog} from '#/components/dms/ReportDialog'
import {CircleX_Stroke2_Corner0_Rounded} from '#/components/icons/CircleX'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {PersonX_Stroke2_Corner0_Rounded as PersonXIcon} from '#/components/icons/Person'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'

export function RejectMenu({
  convo,
  profile,
  size = 'tiny',
  variant = 'outline',
  color = 'secondary',
  label,
  showDeleteConvo,
  currentScreen,
  ...props
}: Omit<ButtonProps, 'onPress' | 'children' | 'label'> & {
  label?: string
  convo: ChatBskyConvoDefs.ConvoView
  profile: ChatBskyActorDefs.ProfileViewBasic
  showDeleteConvo?: boolean
  currentScreen: 'list' | 'conversation'
}) {
  const {_} = useLingui()
  const shadowedProfile = useProfileShadow(profile)
  const navigation = useNavigation<NavigationProp>()
  const {mutate: leaveConvo} = useLeaveConvo(convo.id, {
    onMutate: () => {
      if (currentScreen === 'conversation') {
        navigation.dispatch(StackActions.pop())
      }
    },
    onError: () => {
      Toast.show(
        _(
          msg({
            context: 'toast',
            message: 'Failed to delete chat',
          }),
        ),
        'xmark',
      )
    },
  })
  const [queueBlock] = useProfileBlockMutationQueue(shadowedProfile)

  const onPressDelete = useCallback(() => {
    Toast.show(
      _(
        msg({
          context: 'toast',
          message: 'Chat deleted',
        }),
      ),
      'check',
    )
    leaveConvo()
  }, [leaveConvo, _])

  const onPressBlock = useCallback(() => {
    Toast.show(
      _(
        msg({
          context: 'toast',
          message: 'Account blocked',
        }),
      ),
      'check',
    )
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
              <ButtonText>
                {label || (
                  <Trans comment="Reject a chat request, this opens a menu with options">
                    Reject
                  </Trans>
                )}
              </ButtonText>
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            {showDeleteConvo && (
              <Menu.Item
                label={_(msg`Delete conversation`)}
                onPress={onPressDelete}>
                <Menu.ItemText>
                  <Trans>Delete conversation</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={CircleX_Stroke2_Corner0_Rounded} />
              </Menu.Item>
            )}
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
          currentScreen={currentScreen}
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

export function AcceptChatButton({
  convo,
  size = 'tiny',
  variant = 'solid',
  color = 'secondary_inverted',
  label,
  currentScreen,
  onAcceptConvo,
  ...props
}: Omit<ButtonProps, 'onPress' | 'children' | 'label'> & {
  label?: string
  convo: ChatBskyConvoDefs.ConvoView
  onAcceptConvo?: () => void
  currentScreen: 'list' | 'conversation'
}) {
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: acceptConvo, isPending} = useAcceptConversation(convo.id, {
    onMutate: () => {
      onAcceptConvo?.()
      if (currentScreen === 'list') {
        precacheConvoQuery(queryClient, {...convo, status: 'accepted'})
        navigation.navigate('MessagesConversation', {
          conversation: convo.id,
          accept: true,
        })
      }
    },
    onError: () => {
      // Should we show a toast here? They'll be on the convo screen, and it'll make
      // no difference if the request failed - when they send a message, the convo will be accepted
      // automatically. The only difference is that when they back out of the convo (without sending a message), the conversation will be rejected.
      // the list will still have this chat in it -sfn
      Toast.show(
        _(
          msg({
            context: 'toast',
            message: 'Failed to accept chat',
          }),
        ),
        'xmark',
      )
    },
  })

  const onPressAccept = useCallback(() => {
    acceptConvo()
  }, [acceptConvo])

  return (
    <Button
      {...props}
      label={label || _(msg`Accept chat request`)}
      size={size}
      variant={variant}
      color={color}
      style={a.flex_1}
      onPress={onPressAccept}>
      {isPending ? (
        <ButtonIcon icon={Loader} />
      ) : (
        <ButtonText>
          {label || <Trans comment="Accept a chat request">Accept</Trans>}
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
  currentScreen,
  ...props
}: Omit<ButtonProps, 'children' | 'label'> & {
  label?: string
  convo: ChatBskyConvoDefs.ConvoView
  currentScreen: 'list' | 'conversation'
}) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: leaveConvo} = useLeaveConvo(convo.id, {
    onMutate: () => {
      if (currentScreen === 'conversation') {
        navigation.dispatch(StackActions.pop())
      }
    },
    onError: () => {
      Toast.show(
        _(
          msg({
            context: 'toast',
            message: 'Failed to delete chat',
          }),
        ),
        'xmark',
      )
    },
  })

  const onPressDelete = useCallback(() => {
    Toast.show(
      _(
        msg({
          context: 'toast',
          message: 'Chat deleted',
        }),
      ),
      'check',
    )
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
