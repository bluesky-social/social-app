import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {type ModerationDecision} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlockedByListDialog} from '#/components/dms/BlockedByListDialog'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {ReportConversationPrompt} from '#/components/dms/ReportConversationPrompt'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon} from '#/components/icons/ArrowBoxLeft'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon} from '#/components/icons/Person'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function MessagesListBlockedFooter({
  recipient: initialRecipient,
  convoId,
  moderation,
}: {
  recipient: bsky.profile.AnyProfileView
  convoId: string
  moderation: ModerationDecision
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {t: l} = useLingui()
  const recipient = useProfileShadow(initialRecipient)
  const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(recipient)

  const leaveConvoControl = useDialogControl()
  const reportControl = useDialogControl()
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
    <View style={[a.gap_lg, a.p_2xl, t.atoms.bg]}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']}
        style={[a.absolute, {top: -16, left: 0, right: 0, height: 16}]}
        pointerEvents="none"
      />
      <Text style={[a.text_lg, a.font_semi_bold, a.text_center]}>
        {isBlocking
          ? l`You are blocking this user`
          : l`This user is blocking you`}
      </Text>
      <View style={[a.flex_row, a.justify_between, a.gap_md]}>
        <Button
          label={l`Report chat`}
          color="negative_subtle"
          size="large"
          style={[a.flex_1]}
          onPress={reportControl.open}>
          <ButtonIcon icon={FlagIcon} />
          <ButtonText>
            <Trans>Report chat</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Delete chat`}
          color="secondary"
          size="large"
          style={[a.flex_1]}
          onPress={leaveConvoControl.open}>
          <ButtonIcon icon={LeaveIcon} />
          <ButtonText>
            <Trans>Delete chat</Trans>
          </ButtonText>
        </Button>
        {isBlocking && gtMobile && (
          <Button
            label={l`Unblock user`}
            color="secondary"
            size="large"
            style={[a.flex_1]}
            onPress={onUnblockPress}>
            <ButtonIcon icon={PersonCheckIcon} />
            <ButtonText>
              <Trans>Unblock user</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      {isBlocking && !gtMobile && (
        <Button
          label={l`Unblock user`}
          color="secondary"
          size="large"
          style={[a.flex_1]}
          onPress={onUnblockPress}>
          <ButtonIcon icon={PersonCheckIcon} />
          <ButtonText>
            <Trans>Unblock user</Trans>
          </ButtonText>
        </Button>
      )}
      <LeaveConvoPrompt
        control={leaveConvoControl}
        currentScreen="conversation"
        convoId={convoId}
      />
      <ReportConversationPrompt control={reportControl} />
      <BlockedByListDialog
        control={blockedByListControl}
        listBlocks={listBlocks}
      />
    </View>
  )
}
