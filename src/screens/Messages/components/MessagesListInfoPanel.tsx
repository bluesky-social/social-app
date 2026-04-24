import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useAddGroupMembers} from '#/state/queries/messages/add-group-members'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {AddMembersFlow} from '#/components/dms/AddMembersFlow'
import {type ConvoWithDetails} from '#/components/dms/util'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {InviteLinkDialog} from './InviteLinkDialog'

export function MessagesListInfoPanel({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const addMembersControl = Dialog.useDialogControl()
  const inviteLinkControl = Dialog.useDialogControl()

  const {currentAccount} = useSession()

  const convoId = convo.view.id
  const {mutate: addGroupMembers} = useAddGroupMembers(convoId, {
    onSuccess: () => {
      addMembersControl.close()
    },
    onError: e => {
      logger.error('Failed to add group chat members', {message: e})
      Toast.show(l`Failed to add members`, {type: 'error'})
    },
  })

  // TODO Enable this once the feature is working end-to-end. -dsb
  // const joinLink = groupConvo?.details.joinLink
  const isJoinLinkEnabled = false
  //   (isOwner && groupConvo) ||
  //   (!isOwner && groupConvo && joinLink?.enabledStatus === 'enabled')

  const isOwner = convo?.primaryMember.did === currentAccount?.did

  const members = (convo?.members ?? []).filter(
    profile => profile.did !== currentAccount?.did,
  )

  let names: React.ReactNode = null
  if (members.length === 1) {
    names = <Trans>New chat with {members[0].displayName}</Trans>
  } else if (members.length === 2) {
    names = (
      <Trans>
        New chat with {members[0].displayName} and {members[1].displayName}
      </Trans>
    )
  } else if (members.length > 2) {
    const memberCount = convo.details.memberCount - 2
    names = (
      <Trans>
        New chat with {members[0].displayName}, {members[1].displayName}, and{' '}
        <Plural
          value={memberCount}
          one={`${memberCount} more`}
          other={`${memberCount} more`}
        />
        .
      </Trans>
    )
  }

  const showButtons = isOwner || isJoinLinkEnabled

  return (
    <>
      <View style={[a.align_center, a.justify_center]}>
        <AvatarBubbles animate={true} profiles={convo?.members} />
        {convo.details.name ? (
          <Text style={[a.text_2xl, a.font_bold, a.mt_lg, t.atoms.text]}>
            {convo.details.name}
          </Text>
        ) : null}
        {names ? (
          <Text
            style={[
              a.text_sm,
              a.mt_xs,
              t.atoms.text_contrast_high,
              showButtons ? null : a.mb_4xl,
            ]}>
            {names}
          </Text>
        ) : null}
        {showButtons ? (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_center,
              a.gap_sm,
              a.mt_lg,
              a.mb_4xl,
            ]}>
            {isOwner ? (
              <Button
                color="secondary"
                size="small"
                label={l`Click here to add people to this group chat`}
                onPress={() => addMembersControl.open()}>
                <ButtonIcon icon={PersonPlusIcon} />
                <ButtonText>
                  <Trans>Add people</Trans>
                </ButtonText>
              </Button>
            ) : null}
            {isJoinLinkEnabled ? (
              <Button
                color="secondary"
                size="small"
                label={
                  isOwner
                    ? l`Click here to create or manage an invite link for this group chat`
                    : l`Click here to view the invite link for this group chat`
                }
                onPress={inviteLinkControl.open}>
                <ButtonIcon icon={ChainLinkIcon} />
                <ButtonText>
                  <Trans>Invite link</Trans>
                </ButtonText>
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
      <InviteLinkDialog
        isOwner={isOwner}
        convo={convo}
        control={inviteLinkControl}
      />
      <Dialog.Outer
        control={addMembersControl}
        testID="addChatMembersDialog"
        nativeOptions={{fullHeight: true}}>
        <Dialog.Handle />
        <AddMembersFlow
          members={members.map(profile => profile.did)}
          title={l`Add people`}
          onAddMembers={(members, profiles) =>
            addGroupMembers({members, profiles})
          }
        />
      </Dialog.Outer>
    </>
  )
}
