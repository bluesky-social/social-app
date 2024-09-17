import React, {useCallback} from 'react'
import {View} from 'react-native'
import Animated, {
  FadeInDown,
  FadeOutDown,
  LayoutAnimationConfig,
} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {SimpleViewHeader} from '#/view/com/util/SimpleViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a, native, useAlf, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import {Phone_Stroke2_Corner0_Rounded as PhoneIcon} from '#/components/icons/Phone'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>
export function AppearanceSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const gate = useGate()
  const [neue] = React.useState(() => gate('typography_neue'))
  const {isTabletOrMobile} = useWebMediaQueries()
  const {fonts} = useAlf()

  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  const [fontScale, setFontScale] = React.useState(() => fonts.scale !== 1)
  const [fontFamily, setFontFamily] = React.useState(
    () => fonts.family === 'theme',
  )

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
    <LayoutAnimationConfig skipExiting skipEntering>
      <View testID="preferencesThreadsScreen" style={s.hContentRegion}>
        <ScrollView
          // @ts-ignore web only -prf
          dataSet={{'stable-gutters': 1}}
          contentContainerStyle={{paddingBottom: 75}}>
          <SimpleViewHeader
            showBackButton={isTabletOrMobile}
            style={[t.atoms.border_contrast_medium, a.border_b]}>
            <View style={a.flex_1}>
              <Text style={[a.text_2xl, a.font_bold]}>
                <Trans>Appearance</Trans>
              </Text>
            </View>
          </SimpleViewHeader>

          <View style={[a.gap_3xl, a.pt_xl, a.px_xl]}>
            <View style={[a.gap_lg]}>
              <View style={[a.gap_md]}>
                <View style={[a.flex_row, a.align_center, a.gap_md]}>
                  <PhoneIcon style={t.atoms.text} />
                  <Text style={a.text_md}>
                    <Trans>Mode</Trans>
                  </Text>
                </View>
                <ToggleButton.Group
                  label={_(msg`Dark mode`)}
                  values={[colorMode]}
                  onChange={onChangeAppearance}>
                  <ToggleButton.Button label={_(msg`System`)} name="system">
                    <ToggleButton.ButtonText>
                      <Trans>System</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button label={_(msg`Light`)} name="light">
                    <ToggleButton.ButtonText>
                      <Trans>Light</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button label={_(msg`Dark`)} name="dark">
                    <ToggleButton.ButtonText>
                      <Trans>Dark</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                </ToggleButton.Group>
              </View>

              {colorMode !== 'light' && (
                <Animated.View
                  entering={native(FadeInDown)}
                  exiting={native(FadeOutDown)}
                  style={[a.gap_md]}>
                  <View style={[a.flex_row, a.align_center, a.gap_md]}>
                    <MoonIcon style={t.atoms.text} />
                    <Text style={a.text_md}>
                      <Trans>Dark theme</Trans>
                    </Text>
                  </View>

                  <ToggleButton.Group
                    label={_(msg`Dark theme`)}
                    values={[darkTheme ?? 'dim']}
                    onChange={onChangeDarkTheme}>
                    <ToggleButton.Button label={_(msg`Dim`)} name="dim">
                      <ToggleButton.ButtonText>
                        <Trans>Dim</Trans>
                      </ToggleButton.ButtonText>
                    </ToggleButton.Button>
                    <ToggleButton.Button label={_(msg`Dark`)} name="dark">
                      <ToggleButton.ButtonText>
                        <Trans>Dark</Trans>
                      </ToggleButton.ButtonText>
                    </ToggleButton.Button>
                  </ToggleButton.Group>
                </Animated.View>
              )}
            </View>

            {neue && (
              <View style={[a.gap_lg]}>
                <Text style={[a.text_lg, a.font_bold]}>Typography</Text>

                <Divider />

                <View
                  style={[
                    a.flex_row,
                    a.align_start,
                    a.justify_between,
                    a.gap_xl,
                  ]}>
                  <View style={[a.flex_1, a.gap_xs, {maxWidth: 360}]}>
                    <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                      <Trans>Theme font</Trans>
                    </Text>
                    <Text
                      style={[
                        a.text_sm,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        Enables a consistent typeface for a clean user
                        experience across devices. To use your default system
                        font, disable this.
                      </Trans>
                    </Text>
                  </View>

                  <Toggle.Item
                    name="font"
                    label={_(msg`Use theme font`)}
                    value={fontFamily}
                    onChange={checked => {
                      setFontFamily(checked)
                      fonts.setFontFamily(checked ? 'theme' : 'system')
                    }}>
                    <Toggle.LabelText>
                      {fontFamily ? (
                        <Trans>Enabled</Trans>
                      ) : (
                        <Trans>Disabled</Trans>
                      )}
                    </Toggle.LabelText>
                    <Toggle.Switch />
                  </Toggle.Item>
                </View>

                <Divider />

                <View
                  style={[
                    a.flex_row,
                    a.align_start,
                    a.justify_between,
                    a.gap_xl,
                  ]}>
                  <View style={[a.flex_1, a.gap_xs, {maxWidth: 360}]}>
                    <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                      <Trans>Theme font size</Trans>
                    </Text>
                    <Text
                      style={[
                        a.text_sm,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        Subtly scales the type size for a clean user experience
                        across devices. To use the font size defined by your
                        operating system, disable this.
                      </Trans>
                    </Text>
                  </View>

                  <Toggle.Item
                    name="fontScale"
                    label={_(msg`Enable new font scale`)}
                    value={fontScale}
                    onChange={checked => {
                      setFontScale(checked)
                      fonts.setFontScale(checked ? 0.9375 : 1)
                    }}>
                    <Toggle.LabelText>
                      {fontScale ? (
                        <Trans>Enabled</Trans>
                      ) : (
                        <Trans>Disabled</Trans>
                      )}
                    </Toggle.LabelText>
                    <Toggle.Switch />
                  </Toggle.Item>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </LayoutAnimationConfig>
  )
}
