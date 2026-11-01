import {useState} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/logger'
import {Sentry} from '#/logger/sentry/lib'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Select from '#/components/Select'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const MAX_FEEDBACK_LENGTH = 300

export function BetaFeaturesFeedbackDialog({
  control,
  betaFeatures,
}: {
  control: Dialog.DialogControlProps
  /**
   * The current beta features, with the localized names shown in settings.
   */
  betaFeatures: {key: string; name: string}[]
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <BetaFeaturesFeedbackDialogInner betaFeatures={betaFeatures} />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function BetaFeaturesFeedbackDialogInner({
  betaFeatures,
}: {
  betaFeatures: {key: string; name: string}[]
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const control = Dialog.useDialogContext()

  const [feedback, setFeedback] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const selectedFeatureKey =
    betaFeatures.length === 1
      ? betaFeatures[0].key
      : betaFeatures.find(feature => feature.key === selectedKey)?.key

  const {mutate: onSubmit, isPending} = useMutation({
    mutationFn: (betaFeatureKey: string) => {
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
        {name: currentAccount?.handle, message: feedback.trim()},
        {captureContext: {contexts: {betaFeatures: {keys: [betaFeatureKey]}}}},
      )
      return Promise.resolve()
    },
    onSuccess: (_data, betaFeatureKey) => {
      ax.metric('betaFeatures:feedback:submit', {
        betaFeatureKeys: [betaFeatureKey],
        feedbackLength: feedback.trim().length,
      })
      control.close(() => {
        setFeedback('')
        setSelectedKey('')
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
  const canSubmit =
    !!selectedFeatureKey && feedback.trim().length > 0 && !isPending

  return (
    <Dialog.ScrollableInner
      label={l`Share feedback`}
      style={web({maxWidth: 400})}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_xs]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            {l`Share feedback`}
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            {l`We’d love to hear about your experience testing beta features!`}
          </Text>
        </View>
        {betaFeatures.length > 1 && (
          <Select.Root
            value={selectedFeatureKey ?? ''}
            onValueChange={setSelectedKey}
            disabled={isPending}>
            <Select.Trigger label={l`Select a beta feature`}>
              <Select.ValueText placeholder={l`Select a beta feature`} />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content
              label={l`Select a beta feature`}
              items={betaFeatures.map(feature => ({
                value: feature.key,
                label: feature.name,
              }))}
              renderItem={({label, value}) => (
                <Select.Item value={value} label={label}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              )}
            />
          </Select.Root>
        )}
        <View style={[a.gap_xs]}>
          <Text
            accessibilityLabel={plural(remaining, {
              one: '# character remaining',
              other: '# characters remaining',
            })}
            accessibilityHint=""
            style={[
              a.text_sm,
              a.text_right,
              t.atoms.text_contrast_medium,
              {fontVariant: ['tabular-nums']},
            ]}>
            {remaining}
          </Text>
          <Dialog.Input
            multiline
            autoFocus
            numberOfLines={5}
            label={l`Share your thoughts…`}
            value={feedback}
            maxLength={MAX_FEEDBACK_LENGTH}
            onChangeText={value =>
              setFeedback(value.slice(0, MAX_FEEDBACK_LENGTH))
            }
          />
        </View>
        <View style={[a.gap_sm]}>
          <Button
            label={l`Submit`}
            size="large"
            color="primary"
            disabled={!canSubmit}
            onPress={() => {
              if (selectedFeatureKey) onSubmit(selectedFeatureKey)
            }}>
            <ButtonText>
              <Trans>Submit feedback</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Cancel`}
            size="large"
            color="secondary"
            onPress={() =>
              control.close(() => {
                setFeedback('')
                setSelectedKey('')
              })
            }>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
