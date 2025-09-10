import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {ComAtprotoModerationDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {BLUESKY_MOD_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ChatDisabled() {
  const t = useTheme()
  return (
    <View style={[a.p_md]}>
      <View
        style={[a.align_start, a.p_xl, a.rounded_md, t.atoms.bg_contrast_25]}>
        <Text
          style={[a.text_md, a.font_bold, a.pb_sm, t.atoms.text_contrast_high]}>
          <Trans>Your chats have been disabled</Trans>
        </Text>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
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
  const {_} = useLingui()

  return (
    <>
      <Button
        testID="appealDisabledChatBtn"
        variant="ghost"
        color="secondary"
        size="small"
        onPress={control.open}
        label={_(msg`Appeal this decision`)}
        style={a.mt_sm}>
        <ButtonText>{_(msg`Appeal this decision`)}</ButtonText>
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <DialogInner />
      </Dialog.Outer>
    </>
  )
}

function DialogInner() {
  const {_} = useLingui()
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
          reasonType: ComAtprotoModerationDefs.REASONAPPEAL,
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
      Toast.show(_(msg`Failed to submit appeal, please try again.`), 'xmark')
    },
    onSuccess: () => {
      control.close()
      Toast.show(_(msg({message: 'Appeal submitted', context: 'toast'})))
    },
  })

  const onSubmit = useCallback(() => mutate(), [mutate])
  const onBack = useCallback(() => control.close(), [control])

  return (
    <Dialog.ScrollableInner label={_(msg`Appeal this decision`)}>
      <Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
        <Trans>Appeal this decision</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>
        <Trans>This appeal will be sent to Bluesky's moderation service.</Trans>
      </Text>
      <View style={[a.my_md]}>
        <Dialog.Input
          label={_(msg`Text input field`)}
          placeholder={_(
            msg`Please explain why you think your chats were incorrectly disabled`,
          )}
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
            : [{flexDirection: 'column-reverse'}, a.gap_sm]
        }>
        <Button
          testID="backBtn"
          variant="solid"
          color="secondary"
          size="large"
          onPress={onBack}
          label={_(msg`Back`)}>
          <ButtonText>{_(msg`Back`)}</ButtonText>
        </Button>
        <Button
          testID="submitBtn"
          variant="solid"
          color="primary"
          size="large"
          onPress={onSubmit}
          label={_(msg`Submit`)}>
          <ButtonText>{_(msg`Submit`)}</ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
