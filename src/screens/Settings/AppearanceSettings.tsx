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
import {Props as SVGIconProps} from '#/components/icons/common'
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
      fonts.setFontFamily(next)
    },
    [fonts],
  )

  const onChangeFontScale = useCallback(
    (values: string[]) => {
      const next = values[0] || ('0' as any)
      fonts.setFontScale(next)
    },
    [fonts],
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
              <AppearanceToggleButtonGroup
                title={_(msg`Color mode`)}
                icon={PhoneIcon}
                items={[
                  {
                    label: _(msg`System`),
                    name: 'system',
                  },
                  {
                    label: _(msg`Light`),
                    name: 'light',
                  },
                  {
                    label: _(msg`Dark`),
                    name: 'dark',
                  },
                ]}
                values={[colorMode]}
                onChange={onChangeAppearance}
              />

              {colorMode !== 'light' && (
                <Animated.View
                  entering={native(FadeInDown)}
                  exiting={native(FadeOutDown)}>
                  <AppearanceToggleButtonGroup
                    title={_(msg`Dark theme`)}
                    icon={MoonIcon}
                    items={[
                      {
                        label: _(msg`Dim`),
                        name: 'dim',
                      },
                      {
                        label: _(msg`Dark`),
                        name: 'dark',
                      },
                    ]}
                    values={[darkTheme ?? 'dim']}
                    onChange={onChangeDarkTheme}
                  />
                </Animated.View>
              )}

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
        </ScrollView>
      </View>
    </LayoutAnimationConfig>
  )
}

export function AppearanceToggleButtonGroup({
  title,
  description,
  icon: Icon,
  items,
  values,
  onChange,
}: {
  title: string
  description?: string
  icon: React.ComponentType<SVGIconProps>
  items: {
    label: string
    name: string
  }[]
  values: string[]
  onChange: (values: string[]) => void
}) {
  const t = useTheme()
  return (
    <View style={[a.gap_sm]}>
      <View style={[a.gap_xs]}>
        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <Icon style={t.atoms.text} />
          <Text style={[a.text_md, a.font_bold]}>{title}</Text>
        </View>
        {description && (
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            {description}
          </Text>
        )}
      </View>
      <ToggleButton.Group label={title} values={values} onChange={onChange}>
        {items.map(item => (
          <ToggleButton.Button
            key={item.name}
            label={item.label}
            name={item.name}>
            <ToggleButton.ButtonText>{item.label}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        ))}
      </ToggleButton.Group>
    </View>
  )
}
