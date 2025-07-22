import React from 'react'
import {View} from 'react-native'
import {BSKY_LABELER_DID, ComAtprotoModerationDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/state/ageAssurance/util'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, web} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function AgeAssuranceAppealDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Contact our moderation team`)}
        style={[web({maxWidth: 400})]}>
        <Inner control={control} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {gtPhone} = useBreakpoints()
  const agent = useAgent()

  const [details, setDetails] = React.useState('')
  const isInvalid = details.length > 1000

  const {mutate, isPending} = useMutation({
    mutationFn: async () => {
      logger.metric('ageAssurance:appealDialogSubmit', {})

      await agent.createModerationReport(
        {
          reasonType: ComAtprotoModerationDefs.REASONAPPEAL,
          subject: {
            $type: 'com.atproto.admin.defs#repoRef',
            did: currentAccount?.did,
          },
          reason: `AGE_ASSURANCE_INQUIRY: ` + details,
        },
        {
          encoding: 'application/json',
          headers: {
            'atproto-proxy': `${BSKY_LABELER_DID}#atproto_labeler`,
          },
        },
      )
    },
    onError: err => {
      logger.error('AgeAssuranceAppealDialog failed', {safeMessage: err})
      Toast.show(
        _(msg`Age assurance inquiry failed to send, please try again.`),
        'xmark',
      )
    },
    onSuccess: () => {
      control.close()
      Toast.show(
        _(
          msg({
            message: 'Age assurance inquiry was submitted',
            context: 'toast',
          }),
        ),
      )
    },
  })

  return (
    <View>
      <View style={[a.align_start]}>
        <AgeAssuranceBadge />
      </View>

      <Text style={[a.text_2xl, a.font_heavy, a.pt_md, a.leading_tight]}>
        <Trans>Contact us</Trans>
      </Text>

      <Text style={[a.text_sm, a.pt_sm, a.leading_snug]}>
        <Trans>
          Please provide any additional details you feel moderators may need in
          order to properly assess your Age Assurance status.
        </Trans>
      </Text>

      <View style={[a.pt_md]}>
        <Dialog.Input
          multiline
          isInvalid={isInvalid}
          value={details}
          onChangeText={details => {
            setDetails(details)
          }}
          label={_(msg`Additional details (limit 1000 characters)`)}
          numberOfLines={4}
          onSubmitEditing={() => mutate()}
        />
        <View style={[a.pt_md, a.gap_sm, gtPhone && [a.flex_row_reverse]]}>
          <Button
            label={_(msg`Submit`)}
            size="small"
            variant="solid"
            color="primary"
            onPress={() => mutate()}>
            <ButtonText>
              <Trans>Submit</Trans>
            </ButtonText>
            {isPending && <ButtonIcon icon={Loader} position="right" />}
          </Button>
          <Button
            label={_(msg`Cancel`)}
            size="small"
            variant="solid"
            color="secondary"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </View>
  )
}
