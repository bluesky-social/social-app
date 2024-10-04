import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AppearanceToggleButtonGroup} from '#/screens/Settings/AppearanceSettings'
import {atoms as a, useAlf, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Divider} from '#/components/Divider'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import {Text} from '#/components/Typography'

export function NeueTypography() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()
  const {fonts} = useAlf()

  Dialog.useAutoOpen(control, 3e3)

  const onClose = React.useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  const onChangeFontFamily = React.useCallback(
    (values: string[]) => {
      const next = values[0] === 'system' ? 'system' : 'theme'
      fonts.setFontFamily(next)
    },
    [fonts],
  )

  const onChangeFontScale = React.useCallback(
    (values: string[]) => {
      const next = values[0] || ('0' as any)
      fonts.setFontScale(next)
    },
    [fonts],
  )

  return (
    <Dialog.Outer control={control} onClose={onClose}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Introducing new font settings`)}>
        <View style={[a.gap_xl]}>
          <View style={[a.gap_md]}>
            <Text style={[a.text_3xl, a.font_heavy]}>
              <Trans>New font settings ✨</Trans>
            </Text>
            <Text style={[a.text_lg, a.leading_snug, {maxWidth: 400}]}>
              <Trans>
                We're introducing a new theme font, along with adjustable font
                sizing.
              </Trans>
            </Text>
            <Text
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                You can adjust these in your Appearance Settings later.
              </Trans>
            </Text>
          </View>

          <Divider />

          <View style={[a.gap_lg]}>
            <AppearanceToggleButtonGroup
              title={_(msg`Font`)}
              description={_(
                msg`For the best experience, we recommend using the theme font.`,
              )}
              icon={Aa}
              items={[
                {
                  label: _(msg`System`),
                  name: 'system',
                },
                {
                  label: _(msg`Theme`),
                  name: 'theme',
                },
              ]}
              values={[fonts.family]}
              onChange={onChangeFontFamily}
            />

            <AppearanceToggleButtonGroup
              title={_(msg`Font size`)}
              icon={TextSize}
              items={[
                {
                  label: _(msg`Smaller`),
                  name: '-1',
                },
                {
                  label: _(msg`Default`),
                  name: '0',
                },
                {
                  label: _(msg`Larger`),
                  name: '1',
                },
              ]}
              values={[fonts.scale]}
              onChange={onChangeFontScale}
            />
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
