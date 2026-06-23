import {useCallback} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  FadeInUp,
  FadeOutUp,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {SettingsListItem as AppIconSettingsListItem} from '#/screens/Settings/AppIconSettings/SettingsListItem'
import {type Alf, atoms as a, native, useAlf, useTheme} from '#/alf'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPaletteIcon} from '#/components/icons/ColorPalette'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import {Phone_Stroke2_Corner0_Rounded as PhoneIcon} from '#/components/icons/Phone'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {ACCENTS, DEFAULT_ACCENT} from '#/config/brand-theme'
import {IS_INTERNAL, IS_NATIVE} from '#/env'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>
export function AppearanceSettingsScreen({}: Props) {
  const {_} = useLingui()
  const {fonts} = useAlf()

  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  const onChangeAppearance = useCallback(
    (value: 'light' | 'system' | 'dark') => {
      setColorMode(value)
    },
    [setColorMode],
  )

  const onChangeDarkTheme = useCallback(
    (value: 'dim' | 'dark') => {
      setDarkTheme(value)
    },
    [setDarkTheme],
  )

  const onChangeFontFamily = useCallback(
    (value: 'system' | 'theme') => {
      fonts.setFontFamily(value)
    },
    [fonts],
  )

  const onChangeFontScale = useCallback(
    (value: Alf['fonts']['scale']) => {
      fonts.setFontScale(value)
    },
    [fonts],
  )

  return (
    <LayoutAnimationConfig skipExiting skipEntering>
      <Layout.Screen testID="preferencesThreadsScreen">
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Appearance</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content>
          <SettingsList.Container>
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
              value={colorMode}
              onChange={onChangeAppearance}
            />

            {colorMode !== 'light' && (
              <Animated.View
                entering={native(FadeInUp)}
                exiting={native(FadeOutUp)}>
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
                  value={darkTheme ?? 'dim'}
                  onChange={onChangeDarkTheme}
                />
              </Animated.View>
            )}

            <AccentColorPicker />

            <Animated.View layout={native(LinearTransition)}>
              <SettingsList.Divider />

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
                value={fonts.family}
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
                value={fonts.scale}
                onChange={onChangeFontScale}
              />

              {IS_NATIVE && IS_INTERNAL && (
                <>
                  <SettingsList.Divider />
                  <AppIconSettingsListItem />
                </>
              )}
            </Animated.View>
          </SettingsList.Container>
        </Layout.Content>
      </Layout.Screen>
    </LayoutAnimationConfig>
  )
}

export function AppearanceToggleButtonGroup<T extends string>({
  title,
  description,
  icon: Icon,
  items,
  value,
  onChange,
}: {
  title: string
  description?: string
  icon: React.ComponentType<SVGIconProps>
  items: {
    label: string
    name: T
  }[]
  value: T
  onChange: (value: T) => void
}) {
  const t = useTheme()
  return (
    <>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]} iconInset={false}>
        <SettingsList.ItemIcon icon={Icon} />
        <SettingsList.ItemText>{title}</SettingsList.ItemText>
        {description && (
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.w_full,
            ]}>
            {description}
          </Text>
        )}
        <SegmentedControl.Root
          type="radio"
          label={title}
          value={value}
          onChange={onChange}>
          {items.map(item => (
            <SegmentedControl.Item
              key={item.name}
              label={item.label}
              value={item.name}>
              <SegmentedControl.ItemText>
                {item.label}
              </SegmentedControl.ItemText>
            </SegmentedControl.Item>
          ))}
        </SegmentedControl.Root>
      </SettingsList.Group>
    </>
  )
}

// Eurosky: per-user accent picker. Swatches are the curated brand accent
// families (brand-colors.json#accents); selecting one persists `accentColor`,
// which ThemeProvider applies live via `themesOverride`. undefined = the
// brand's defaultAccent.
const ACCENT_KEYS = Object.keys(ACCENTS)

function accentLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function AccentColorPicker() {
  const t = useTheme()
  const {_} = useLingui()
  const {accentColor} = useThemePrefs()
  const {setAccentColor} = useSetThemePrefs()
  const selected = accentColor ?? DEFAULT_ACCENT
  return (
    <SettingsList.Group contentContainerStyle={[a.gap_sm]} iconInset={false}>
      <SettingsList.ItemIcon icon={ColorPaletteIcon} />
      <SettingsList.ItemText>{_(msg`Accent color`)}</SettingsList.ItemText>
      <View style={[a.flex_row, a.gap_lg, a.flex_wrap, a.w_full, a.pt_xs]}>
        {ACCENT_KEYS.map(key => {
          const isSelected = selected === key
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={accentLabel(key)}
              accessibilityHint={_(msg`Sets the app accent color`)}
              accessibilityState={{selected: isSelected}}
              onPress={() => setAccentColor(key)}
              style={[a.align_center, a.gap_xs]}>
              <View
                style={[
                  a.rounded_full,
                  {
                    width: 40,
                    height: 40,
                    backgroundColor: ACCENTS[key].primary_500,
                    borderWidth: 3,
                    borderColor: isSelected
                      ? t.atoms.text.color
                      : 'transparent',
                  },
                ]}
              />
              <Text
                style={[
                  a.text_xs,
                  isSelected ? a.font_bold : undefined,
                  t.atoms.text_contrast_medium,
                ]}>
                {accentLabel(key)}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </SettingsList.Group>
  )
}
