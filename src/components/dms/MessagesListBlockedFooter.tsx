import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {type ModerationDecision} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlockedByListDialog} from '#/components/dms/BlockedByListDialog'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon} from '#/components/icons/ArrowBoxLeft'
import {
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function MessagesListBlockedFooter({
  recipient: initialRecipient,
  convoId,
  moderation,
  isGroup,
}: {
  recipient: bsky.profile.AnyProfileView
  convoId: string
  moderation: ModerationDecision
  isGroup: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const recipient = useProfileShadow(initialRecipient)
  const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(recipient)

  const leaveConvoControl = useDialogControl()
  const blockedByListControl = useDialogControl()

  const {listBlocks, userBlock} = useMemo(() => {
    const modui = moderation.ui('profileView')
    const blocks = modui.alerts.filter(alert => alert.type === 'blocking')
    const listBlocks = blocks.filter(alert => alert.source.type === 'list')
    const userBlock = blocks.find(alert => alert.source.type === 'user')
    return {
      listBlocks,
      userBlock,
    }
  }, [moderation])

  const isBlocking = !!userBlock || !!listBlocks.length

  const onUnblockPress = useCallback(() => {
    if (listBlocks.length) {
      blockedByListControl.open()
    } else {
      void queueUnblock()
    }
  }, [blockedByListControl, listBlocks, queueUnblock])

  return (
    <View style={[a.p_md]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.p_lg,
          t.atoms.bg_contrast_50,
          {borderRadius: 40},
        ]}>
        <PersonXIcon fill={t.atoms.text.color} size="lg" style={[a.mb_xs]} />
        <Text
          style={[
            a.mb_xs,
            a.text_center,
            a.text_md,
            a.font_semi_bold,
            t.atoms.text,
          ]}>
          {isGroup
            ? l`You are blocking the chat owner`
            : isBlocking
              ? l`You are blocking this person`
              : l`This person is blocking you`}
        </Text>
        <Text
          style={[
            a.text_center,
            a.text_sm,
            a.leading_snug,
            t.atoms.text_contrast_high,
          ]}>
          <Trans>You can read chat history but can’t send new messages.</Trans>
        </Text>
        {isBlocking ? (
          <Button
            label={l`Unblock`}
            color="secondary_inverted"
            size="large"
            style={[a.mt_lg, a.w_full]}
            onPress={onUnblockPress}>
            <ButtonIcon icon={PersonCheckIcon} />
            <ButtonText>
              <Trans>Unblock</Trans>
            </ButtonText>
          </Button>
        ) : null}
        <Button
          label={l`Leave chat`}
          color="secondary_inverted"
          size="large"
          style={[a.mt_lg, a.w_full]}
          onPress={leaveConvoControl.open}>
          <ButtonIcon icon={LeaveIcon} />
          <ButtonText>
            <Trans>Leave chat</Trans>
          </ButtonText>
        </Button>
        <LeaveConvoPrompt
          control={leaveConvoControl}
          currentScreen="conversation"
          convoId={convoId}
        />
        <BlockedByListDialog
          control={blockedByListControl}
          listBlocks={listBlocks}
        />
      </View>
    </View>
  )
}
