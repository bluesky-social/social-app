import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {isIOS} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {
  usePreferencesQuery,
  usePreferencesSetAdultContentMutation,
} from '#/state/queries/preferences'
import {logger} from '#/logger'
import {Text} from '#/components/Typography'
import {InlineLink} from '#/components/Link'
import * as Toggle from '#/components/forms/Toggle'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'

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

  if (!preferences) return null

  if (isIOS) {
    if (preferences?.adultContentEnabled === true) {
      return null
    } else {
      return (
        <Card>
          <CircleInfo size="sm" fill={t.palette.contrast_500} />
          <Text
            style={[
              a.flex_1,
              t.atoms.text_contrast_700,
              a.leading_snug,
              {paddingTop: 1},
            ]}>
            <Trans>
              Adult content can only be enabled via the Web at{' '}
              <InlineLink style={[a.leading_snug]} to="https://bsky.app">
                bsky.app
              </InlineLink>
              .
            </Trans>
          </Text>
        </Card>
      )
    }
  } else {
    if (preferences?.userAge) {
      if (preferences.userAge >= 18) {
        return (
          <View style={[a.w_full]}>
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
        )
      } else {
        return (
          <Card>
            <CircleInfo size="sm" fill={t.palette.contrast_500} />
            <Text
              style={[
                a.flex_1,
                t.atoms.text_contrast_700,
                a.leading_snug,
                {paddingTop: 1},
              ]}>
              <Trans>
                You must be 18 years or older to enable adult content
              </Trans>
            </Text>
          </Card>
        )
      }
    }

    return null
  }
}
