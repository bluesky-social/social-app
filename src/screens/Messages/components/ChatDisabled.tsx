import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {ToolsOzoneReportDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {BLUESKY_MOD_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function ChatDisabled() {
  const t = useTheme()
  return (
    <View style={[a.p_md]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.p_lg,
          t.atoms.bg_contrast_50,
          {
            borderRadius: 40,
          },
        ]}>
        <WarningIcon fill={t.atoms.text.color} size="lg" style={[a.mb_xs]} />
        <Text
          style={[
            a.mb_xs,
            a.text_center,
            a.text_md,
            a.font_semi_bold,
            t.atoms.text,
          ]}>
          <Trans>Your chats have been disabled</Trans>
        </Text>
        <Text
          style={[
            a.text_center,
            a.text_sm,
            a.leading_snug,
            t.atoms.text_contrast_high,
          ]}>
          <Trans>
            Our moderators have reviewed reports and decided to disable your
            access to chats on Bluesky.
          </Trans>
        </Text>
        <AppealDialog />
      </View>
    </View>
  )
}

function AppealDialog() {
  const control = Dialog.useDialogControl()
  const {t: l} = useLingui()

  return (
    <>
      <Button
        testID="appealDisabledChatBtn"
        color="secondary_inverted"
        size="small"
        onPress={control.open}
        label={l`Appeal this decision`}
        style={a.mt_lg}>
        <ButtonText>
          <Trans>Appeal this decision</Trans>
        </ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <DialogInner />
      </Dialog.Outer>
    </>
  )
}

function DialogInner() {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const [details, setDetails] = useState('')
  const {gtMobile} = useBreakpoints()
  const agent = useAgent()
  const {currentAccount} = useSession()

  const {mutate, isPending} = useMutation({
    mutationFn: async () => {
      if (!currentAccount)
        throw new Error('No current account, should be unreachable')
      await agent.createModerationReport(
        {
          reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
          subject: {
            $type: 'com.atproto.admin.defs#repoRef',
            did: currentAccount.did,
          },
          reason: details,
        },
        {
          encoding: 'application/json',
          headers: BLUESKY_MOD_SERVICE_HEADERS,
        },
      )
    },
    onError: err => {
      logger.error('Failed to submit chat appeal', {message: err})
      Toast.show(l`Failed to submit appeal, please try again.`, {
        type: 'error',
      })
    },
    onSuccess: () => {
      control.close()
      Toast.show(l({message: 'Appeal submitted', context: 'toast'}))
    },
  })

  const onSubmit = useCallback(() => mutate(), [mutate])
  const onBack = useCallback(() => control.close(), [control])

  return (
    <Dialog.ScrollableInner label={l`Appeal this decision`}>
      <Text style={[a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_tight]}>
        <Trans>Appeal this decision</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>
        <Trans>This appeal will be sent to Bluesky's moderation service.</Trans>
      </Text>
      <View style={[a.my_md]}>
        <Dialog.Input
          label={l`Text input field`}
          placeholder={l`Please explain why you think your chats were incorrectly disabled`}
          value={details}
          onChangeText={setDetails}
          autoFocus={true}
          numberOfLines={3}
          multiline
          maxLength={300}
        />
      </View>
      <View
        style={
          gtMobile
            ? [a.flex_row, a.justify_between]
            : [a.flex_col_reverse, a.gap_sm]
        }>
        <Button
          testID="backBtn"
          variant="solid"
          color="secondary"
          size="large"
          onPress={onBack}
          label={l`Back`}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <Button
          testID="submitBtn"
          variant="solid"
          color="primary"
          size="large"
          onPress={onSubmit}
          label={l`Submit`}>
          <ButtonText>
            <Trans>Submit</Trans>
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
