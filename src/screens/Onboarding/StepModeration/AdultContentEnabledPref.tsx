import {atoms as a, useTheme} from '#/alf'
import {
  usePreferencesQuery,
  usePreferencesSetAdultContentMutation,
} from 'state/queries/preferences'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import React from 'react'
import {isIOS, isNative} from 'platform/detection'
import * as Toast from 'view/com/util/Toast'
import {logger} from '#/logger'
import * as Prompt from '#/components/Prompt'
import {View} from 'react-native'
import {Text} from '#/components/Typography'
import {InlineLink} from '#/components/Link'
import {Button, ButtonText} from '#/components/Button'
import {SetAgeDialog} from '#/screens/Onboarding/StepModeration/SetAgeDialog'
import * as Toggle from '#/components/forms/Toggle'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'

export function AdultContentEnabledPref() {
  const {_} = useLingui()
  const t = useTheme()

  // Reuse logic here form ContentFilteringSettings.tsx
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetAdultContentMutation()

  const onToggleAdultContent = React.useCallback(async () => {
    if (isIOS) return

    try {
      mutate({
        enabled: !(variables?.enabled ?? preferences?.adultContentEnabled),
      })
    } catch (e) {
      Toast.show(
        _(msg`There was an issue syncing your preferences with the server`),
      )
      logger.error('Failed to update preferences with server', {error: e})
    }
  }, [variables, preferences, mutate, _])

  const prompt = Prompt.usePromptControl()

  return (
    <View style={[a.w_full]}>
      {isNative ? (
        <View
          style={[
            a.flex_row,
            a.flex_wrap,
            a.gap_sm,
            a.px_md,
            a.py_sm,
            a.rounded_sm,
            a.mb_md,
            t.atoms.bg_contrast_50,
          ]}>
          <CircleInfo size="sm" fill={t.palette.contrast_500} />
          <Text style={[t.atoms.text_contrast_700, {paddingTop: 1}]}>
            <Trans>
              Adult content can only be enabled via the Web at{' '}
              <InlineLink to="https://bsky.app">bsky.app</InlineLink>.
            </Trans>
          </Text>
        </View>
      ) : typeof preferences?.birthDate === 'undefined' ? (
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.px_lg,
            a.py_md,
            a.rounded_sm,
            a.mb_md,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[a.font_bold]}>
            <Trans>Confirm your age to enable adult content.</Trans>
          </Text>
          <Button
            variant="solid"
            color="negative"
            size="small"
            label={_(
              msg`Click here to add your birth date and confirm your age`,
            )}
            onPress={prompt.open}>
            <ButtonText>Set birth date</ButtonText>
          </Button>
        </View>
      ) : (preferences?.userAge || 0) >= 18 ? (
        <Toggle.Item
          name="Show Quotes"
          label="Show quotes in Following"
          value={variables?.enabled ?? preferences?.adultContentEnabled}
          onChange={onToggleAdultContent}>
          <View
            style={[
              a.flex_row,
              a.w_full,
              a.justify_between,
              a.align_center,
              a.py_md,
            ]}>
            <Text style={[a.font_bold]}>Enable Adult Content</Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
      ) : (
        <View
          style={[
            a.flex_row,
            t.atoms.bg_contrast_25,
            a.align_center,
            a.justify_between,
            a.px_md,
            a.py_md,
            {borderRadius: 8},
          ]}>
          <Text style={[a.font_bold]}>
            <Trans>
              You must be 18 years or older to enable adult content.
            </Trans>
          </Text>
          <Button
            variant="gradient"
            color="gradient_sky"
            size="small"
            label="Set Age"
            onPress={prompt.open}>
            <ButtonText>Set Age</ButtonText>
          </Button>
        </View>
      )}

      <SetAgeDialog prompt={prompt} preferences={preferences} />
    </View>
  )
}
