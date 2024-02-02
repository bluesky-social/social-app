import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {UseMutateFunction} from '@tanstack/react-query'

import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {logger} from '#/logger'
import {Text} from '#/components/Typography'
import * as Toggle from '#/components/forms/Toggle'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import * as Prompt from '#/components/Prompt'
import {isIOS} from '#/platform/detection'

function Card({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_lg,
        a.py_md,
        a.rounded_sm,
        a.mb_md,
        t.atoms.bg_contrast_50,
      ]}>
      {children}
    </View>
  )
}

export function AdultContentEnabledPref({
  mutate,
  variables,
}: {
  mutate: UseMutateFunction<void, unknown, {enabled: boolean}, unknown>
  variables: {enabled: boolean} | undefined
}) {
  const {_} = useLingui()
  const t = useTheme()
  const prompt = Prompt.usePromptControl()

  // Reuse logic here form ContentFilteringSettings.tsx
  const {data: preferences} = usePreferencesQuery()

  const onToggleAdultContent = React.useCallback(async () => {
    if (isIOS) {
      prompt.open()
      return
    }

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
  }, [variables, preferences, mutate, _, prompt])

  if (!preferences) return null

  return (
    <>
      {preferences.userAge && preferences.userAge >= 18 ? (
        <View style={[a.w_full, a.px_xs]}>
          <Toggle.Item
            name={_(msg`Enable adult content in your feeds`)}
            label={_(msg`Enable adult content in your feeds`)}
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
        </View>
      ) : (
        <Card>
          <CircleInfo size="sm" fill={t.palette.contrast_500} />
          <Text
            style={[
              a.flex_1,
              t.atoms.text_contrast_700,
              a.leading_snug,
              {paddingTop: 1},
            ]}>
            <Trans>You must be 18 years or older to enable adult content</Trans>
          </Text>
        </Card>
      )}

      <Prompt.Outer control={prompt}>
        <Prompt.Title>Adult Content</Prompt.Title>
        <Prompt.Description>
          <Trans>
            Due to Apple policies, adult content can only be enabled on the web
            after completing sign up.
          </Trans>
        </Prompt.Description>
        <Prompt.Actions>
          <Prompt.Action onPress={prompt.close}>OK</Prompt.Action>
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
