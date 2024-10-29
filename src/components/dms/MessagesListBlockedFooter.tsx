import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, ModerationCause} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {BlockedByListDialog} from '#/components/dms/BlockedByListDialog'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {ReportConversationPrompt} from '#/components/dms/ReportConversationPrompt'
import {Text} from '#/components/Typography'

export function MessagesListBlockedFooter({
  recipient: initialRecipient,
  convoId,
  hasMessages,
  blockInfo,
}: {
  recipient: AppBskyActorDefs.ProfileViewBasic
  convoId: string
  hasMessages: boolean
  blockInfo: {
    listBlocks: ModerationCause[]
    userBlock: ModerationCause | undefined
  }
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const recipient = useProfileShadow(initialRecipient)
  const [__, queueUnblock] = useProfileBlockMutationQueue(recipient)

  const leaveConvoControl = useDialogControl()
  const reportControl = useDialogControl()
  const blockedByListControl = useDialogControl()

  const {listBlocks, userBlock} = blockInfo
  const isBlocking = !!userBlock || !!listBlocks.length

  const onUnblockPress = React.useCallback(() => {
    if (listBlocks.length) {
      blockedByListControl.open()
    } else {
      queueUnblock()
    }
  }, [blockedByListControl, listBlocks, queueUnblock])

  return (
    <View style={[hasMessages && a.pt_md, a.pb_xl, a.gap_lg]}>
      <Divider />
      <Text style={[a.text_md, a.font_bold, a.text_center]}>
        {isBlocking ? (
          <Trans>You have blocked this user</Trans>
        ) : (
          <Trans>This user has blocked you</Trans>
        )}
      </Text>

      <View style={[a.flex_row, a.justify_between, a.gap_lg, a.px_md]}>
        <Button
          label={_(msg`Leave chat`)}
          color="secondary"
          variant="solid"
          size="small"
          style={[a.flex_1]}
          onPress={leaveConvoControl.open}>
          <ButtonText style={{color: t.palette.negative_500}}>
            <Trans>Leave chat</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`Report`)}
          color="secondary"
          variant="solid"
          size="small"
          style={[a.flex_1]}
          onPress={reportControl.open}>
          <ButtonText style={{color: t.palette.negative_500}}>
            <Trans>Report</Trans>
          </ButtonText>
        </Button>
        {isBlocking && gtMobile && (
          <Button
            label={_(msg`Unblock`)}
            color="secondary"
            variant="solid"
            size="small"
            style={[a.flex_1]}
            onPress={onUnblockPress}>
            <ButtonText style={{color: t.palette.primary_500}}>
              <Trans>Unblock</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      {isBlocking && !gtMobile && (
        <View style={[a.flex_row, a.justify_center, a.px_md]}>
          <Button
            label={_(msg`Unblock`)}
            color="secondary"
            variant="solid"
            size="small"
            style={[a.flex_1]}
            onPress={onUnblockPress}>
            <ButtonText style={{color: t.palette.primary_500}}>
              <Trans>Unblock</Trans>
            </ButtonText>
          </Button>
        </View>
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
