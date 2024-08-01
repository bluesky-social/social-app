import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {atoms as a, useBreakpoints} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Button, ButtonText} from '../Button'
import {Text} from '../Typography'

export function ThemeSelectDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogContent />
    </Dialog.Outer>
  )
}

function DialogContent() {
  const {_} = useLingui()
  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()
  const {close} = Dialog.useDialogContext()
  const {gtMobile} = useBreakpoints()

  const onChangeAppearance = useCallback(
    (keys: string[]) => {
      const appearance = keys.find(key => key !== colorMode) as
        | 'system'
        | 'light'
        | 'dark'
        | undefined
      if (!appearance) return
      setColorMode(appearance)
    },
    [setColorMode, colorMode],
  )

  const onChangeDarkTheme = useCallback(
    (keys: string[]) => {
      const theme = keys.find(key => key !== darkTheme) as
        | 'dim'
        | 'dark'
        | undefined
      if (!theme) return
      setDarkTheme(theme)
    },
    [setDarkTheme, darkTheme],
  )

  return (
    <Dialog.ScrollableInner
      label={_(msg`Change theme`)}
      style={[gtMobile && {maxWidth: 330}, a.w_full]}>
      <View style={a.gap_2xl}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Appearance</Trans>
        </Text>
        <View style={a.gap_lg}>
          <Text style={[a.text_lg, a.font_bold]}>
            <Trans>Dark mode</Trans>
          </Text>

          <Toggle.Group
            label={_(msg`Dark mode`)}
            values={[colorMode]}
            onChange={onChangeAppearance}>
            <View style={[a.gap_md]}>
              <Toggle.Item label={_(msg`Light`)} name="light">
                <Toggle.Radio />
                <Toggle.LabelText style={a.text_md}>
                  <Trans>Light</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
              <Toggle.Item label={_(msg`Dark`)} name="dark">
                <Toggle.Radio />
                <Toggle.LabelText style={a.text_md}>
                  <Trans>Dark</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
              <Toggle.Item label={_(msg`System`)} name="system">
                <Toggle.Radio />
                <Toggle.LabelText style={a.text_md}>
                  <Trans>System</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
            </View>
          </Toggle.Group>
        </View>

        {colorMode !== 'light' && (
          <View style={a.gap_lg}>
            <Text style={[a.text_lg, a.font_bold]}>
              <Trans>Theme</Trans>
            </Text>

            <Toggle.Group
              label={_(msg`Dark theme`)}
              values={[darkTheme ?? 'dim']}
              onChange={onChangeDarkTheme}>
              <View style={[a.gap_md]}>
                <Toggle.Item label={_(msg`Dim`)} name="dim">
                  <Toggle.Radio />
                  <Toggle.LabelText style={a.text_md}>
                    <Trans>Dim</Trans>
                  </Toggle.LabelText>
                </Toggle.Item>
                <Toggle.Item label={_(msg`Dark`)} name="dark">
                  <Toggle.Radio />
                  <Toggle.LabelText style={a.text_md}>
                    <Trans>Dark</Trans>
                  </Toggle.LabelText>
                </Toggle.Item>
              </View>
            </Toggle.Group>
          </View>
        )}

        {isNative && (
          <Button
            label={_(msg`Close dialog`)}
            onAccessibilityEscape={close}
            onPress={() => close()}
            size="medium"
            variant="solid"
            color="primary"
            style={a.mt_lg}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
