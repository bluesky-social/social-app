/**
 * StreakExplainerDialog (S10).
 *
 * Shared bottom-sheet (native) / modal (web) implementation via
 * `#/components/Dialog`. Renders currentStreak, longestStreak, the rule
 * sheet, and a grace-day note (only when graceUsedForCurrentStreak is
 * true — G2). The "Open Settings" link uses the dialog-close callback
 * pattern (CLAUDE.md footgun) before navigating.
 *
 * No share CTA (A8, G5).
 */

import React from 'react'
import {View} from 'react-native'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {useStreakStore} from '#/features/activityAndRecap/hooks/useStreakStore'

/**
 * Re-export Dialog.useDialogControl as a named hook so the rest of the
 * feature has a single import surface for the explainer's control.
 */
export const useStreakExplainerControl = Dialog.useDialogControl

export function StreakExplainerDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}): React.ReactElement {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <StreakExplainerInner control={control} />
    </Dialog.Outer>
  )
}

function StreakExplainerInner({
  control,
}: {
  control: Dialog.DialogControlProps
}): React.ReactElement {
  const t = useTheme()
  const {_} = useLingui()
  const store = useStreakStore()
  const navigation = useNavigation<NavigationProp>()

  const current = store?.currentStreak ?? 0
  const longest = store?.longestStreak ?? 0
  const graced = !!store?.graceUsedForCurrentStreak

  const onSettingsPress = () => {
    // CLAUDE.md footgun: dialog close callback BEFORE navigation.
    control.close(() => {
      navigation.navigate('ActivityAndRecap')
    })
  }

  return (
    <Dialog.ScrollableInner label={_(msg`Streak explainer`)}>
      <Dialog.Header>
        <Dialog.HeaderText>
          <Trans>Your Bluesky streak</Trans>
        </Dialog.HeaderText>
      </Dialog.Header>

      <View style={[a.gap_md, a.pt_sm]}>
        <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
          {_(
            msg`${plural(current, {one: '# day', other: '# days'})} current streak`,
          )}
        </Text>

        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          {_(msg`Longest: ${plural(longest, {one: '# day', other: '# days'})}`)}
        </Text>

        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>
            Visit Bluesky once a day to keep your streak going. Miss a single
            day and we'll quietly forgive it once per streak.
          </Trans>
        </Text>

        {graced && (
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>
              You used your grace day for this streak — try not to miss another!
            </Trans>
          </Text>
        )}

        <Button
          label={_(msg`Open Activity & Recap settings`)}
          color="secondary"
          size="small"
          onPress={onSettingsPress}>
          <ButtonText>
            <Trans>Open settings</Trans>
          </ButtonText>
        </Button>
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
