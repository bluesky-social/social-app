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
import {s} from '#/lib/styles'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {SimpleViewHeader} from '#/view/com/util/SimpleViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a, native, useAlf, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import {Phone_Stroke2_Corner0_Rounded as PhoneIcon} from '#/components/icons/Phone'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>
export function AppearanceSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {isTabletOrMobile} = useWebMediaQueries()
  const {fonts} = useAlf()

  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  const [fontFamily, setFontFamily] = React.useState(fonts.family)
  const [fontScale, setFontScale] = React.useState(() => fonts.scale)

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

  const onChangeFontFamily = useCallback(
    (values: string[]) => {
      const next = values[0] === 'system' ? 'system' : 'theme'
      setFontFamily(next)
      fonts.setFontFamily(next)
    },
    [setFontFamily, fonts],
  )

  const onChangeFontScale = useCallback(
    (values: string[]) => {
      const next = values[0] || ('0' as any)
      setFontScale(next)
      fonts.setFontScale(next)
    },
    [setFontScale, fonts],
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
                  <Text style={[a.text_md, a.font_bold]}>
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
                    <Text style={[a.text_md, a.font_bold]}>
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

              <View style={[a.gap_md]}>
                <View style={[a.gap_xs]}>
                  <View style={[a.flex_row, a.align_center, a.gap_md]}>
                    <Aa style={t.atoms.text} />
                    <Text style={[a.text_md, a.font_bold]}>
                      <Trans>Font</Trans>
                    </Text>
                  </View>
                  <Text
                    style={[
                      a.text_sm,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>
                      For the best experience, we recommend using the theme
                      font.
                    </Trans>
                  </Text>
                </View>
                <ToggleButton.Group
                  label={_(msg`Font`)}
                  values={[fontFamily]}
                  onChange={onChangeFontFamily}>
                  <ToggleButton.Button label={_(msg`System`)} name="system">
                    <ToggleButton.ButtonText>
                      <Trans>System</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button label={_(msg`Theme`)} name="theme">
                    <ToggleButton.ButtonText>
                      <Trans>Theme</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                </ToggleButton.Group>
              </View>

              <View style={[a.gap_md]}>
                <View style={[a.gap_xs]}>
                  <View style={[a.flex_row, a.align_center, a.gap_md]}>
                    <TextSize style={t.atoms.text} />
                    <Text style={[a.text_md, a.font_bold]}>
                      <Trans>Font size</Trans>
                    </Text>
                  </View>
                </View>

                <ToggleButton.Group
                  label={_(msg`Font`)}
                  values={[fontScale]}
                  onChange={onChangeFontScale}>
                  <ToggleButton.Button label={_(msg`Small`)} name="-1">
                    <ToggleButton.ButtonText>
                      <Trans>Smaller</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button label={_(msg`Default`)} name="0">
                    <ToggleButton.ButtonText>
                      <Trans>Default</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button label={_(msg`Large`)} name="1">
                    <ToggleButton.ButtonText>
                      <Trans>Larger</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                </ToggleButton.Group>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </LayoutAnimationConfig>
  )
}
