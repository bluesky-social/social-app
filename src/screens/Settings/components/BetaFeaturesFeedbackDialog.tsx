import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/logger'
import {Sentry} from '#/logger/sentry/lib'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

const MAX_FEEDBACK_LENGTH = 200

export function BetaFeaturesFeedbackDialog({
  control,
  betaFeatureKeys,
}: {
  control: Dialog.DialogControlProps
  /**
   * The keys of the beta feature gates that are currently active for this user,
   * attached to the feedback report for context.
   */
  betaFeatureKeys: string[]
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <BetaFeaturesFeedbackDialogInner betaFeatureKeys={betaFeatureKeys} />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function BetaFeaturesFeedbackDialogInner({
  betaFeatureKeys,
}: {
  betaFeatureKeys: string[]
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const {currentAccount} = useSession()
  const [feedback, setFeedback] = useState('')

  const {mutate: onSubmit, isPending} = useMutation({
    mutationFn: () => {
      /*
       * `captureFeedback` is a no-op when the Sentry client is disabled (e.g. in
       * dev, where `init` sets `enabled: false`). It returns synchronously
       * without sending or throwing, so guard here to route to the error toast
       * instead of falsely reporting success.
       */
      const enabled = Sentry.getClient()?.getOptions().enabled ?? false
      if (!enabled) {
        throw new Error('Sentry is disabled; feedback was not sent')
      }
      Sentry.captureFeedback(
        {
          message: feedback.trim(),
          email: currentAccount?.email,
        },
        {
          captureContext: {
            contexts: {
              betaFeatures: {keys: betaFeatureKeys},
            },
          },
        },
      )
      return Promise.resolve()
    },
    onSuccess: () => {
      control.close(() => {
        Toast.show(l`Thanks for your feedback!`)
      })
    },
    onError: error => {
      logger.error('Failed to send beta features feedback', {
        safeMessage: error,
      })
      Toast.show(l`Something went wrong, please try again.`, {type: 'error'})
    },
  })

  const remaining = MAX_FEEDBACK_LENGTH - feedback.length
  const canSubmit = feedback.trim().length > 0 && !isPending

  return (
    <Dialog.ScrollableInner
      label={l`Share feedback`}
      style={web({maxWidth: 420})}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_xs]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            {l`Share feedback`}
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            {l`Let us know what you think!`}
          </Text>
        </View>
        <View style={[a.gap_xs]}>
          <Dialog.Input
            multiline
            numberOfLines={5}
            label={l`Feedback`}
            value={feedback}
            maxLength={MAX_FEEDBACK_LENGTH}
            onChangeText={value =>
              setFeedback(value.slice(0, MAX_FEEDBACK_LENGTH))
            }
          />
          <Text
            style={[
              a.text_sm,
              a.text_right,
              t.atoms.text_contrast_medium,
              {fontVariant: ['tabular-nums']},
            ]}>
            {`${remaining}/${MAX_FEEDBACK_LENGTH}`}
          </Text>
        </View>
        <View style={[a.gap_sm]}>
          <Button
            label={l`Submit`}
            size="large"
            color="primary"
            disabled={!canSubmit}
            onPress={() => onSubmit()}>
            <ButtonText>
              <Trans>Submit</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Cancel`}
            size="large"
            color="secondary"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
