import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Shadow} from 'state/cache/types'
import {useProfileBlockMutationQueue} from 'state/queries/profile'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {ReportConversationPrompt} from '#/components/dms/ReportConversationPrompt'
import {Text} from '#/components/Typography'

export function MessagesListBlockedFooter({
  recipient,
  convoId,
  hasMessages,
  isBlocking,
  isBlockedBy,
}: {
  recipient: Shadow<AppBskyActorDefs.ProfileViewBasic>
  convoId: string
  hasMessages: boolean
  isBlocking: boolean
  isBlockedBy: boolean
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const [__, queueUnblock] = useProfileBlockMutationQueue(recipient)

  const leaveConvoControl = useDialogControl()
  const reportControl = useDialogControl()

  return (
    <View style={[hasMessages && a.pt_md, a.pb_xl, a.gap_lg]}>
      {hasMessages && (
        <>
          <Divider />
        </>
      )}
      <Text style={[a.text_md, a.font_bold, a.text_center]}>
        {isBlockedBy ? (
          <Trans>This user has blocked you</Trans>
        ) : (
          <Trans>You have blocked this user</Trans>
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
            onPress={queueUnblock}>
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
            onPress={queueUnblock}>
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
    </View>
  )
}
