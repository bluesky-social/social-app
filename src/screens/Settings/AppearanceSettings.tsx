import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  FadeInUp,
  FadeOutUp,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as DynamicAppIcon from '@mozzius/expo-dynamic-app-icon'
import {useFocusEffect} from '@react-navigation/native'

import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {atoms as a, native, useAlf, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Props as SVGIconProps} from '#/components/icons/common'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import {Phone_Stroke2_Corner0_Rounded as PhoneIcon} from '#/components/icons/Phone'
import {Shapes_Stroke2_Corner0_Rounded as Shapes} from '#/components/icons/Shapes'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {AppIconImage, useAppIconSets} from './components/AppIcon'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>
export function AppearanceSettingsScreen({}: Props) {
  const {_} = useLingui()
  const {fonts} = useAlf()

  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  const appIconSets = useAppIconSets()
  const [currentAppIcon, setCurrentAppIcon] = useState(() =>
    DynamicAppIcon.getAppIcon(),
  )

  const icon =
    appIconSets.defaults.find(i => i.id === currentAppIcon) ??
    appIconSets.core.find(i => i.id === currentAppIcon) ??
    appIconSets.defaults[0]

  // refresh current icon when screen is focused
  useFocusEffect(
    useCallback(() => {
      setCurrentAppIcon(DynamicAppIcon.getAppIcon())
    }, []),
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

  const {currentAccount} = useSession()

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
              values={[colorMode]}
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
                  values={[darkTheme ?? 'dim']}
                  onChange={onChangeDarkTheme}
                />
              </Animated.View>
            )}

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

              {isNative && DISCOVER_DEBUG_DIDS[currentAccount?.did ?? ''] && (
                <>
                  <SettingsList.Divider />

                  <SettingsList.LinkItem
                    to="/settings/app-icon"
                    label={_(msg`App Icon`)}
                    contentContainerStyle={[a.align_start]}>
                    <SettingsList.ItemIcon icon={Shapes} />
                    <View style={[a.flex_1]}>
                      <SettingsList.ItemText style={[a.pt_xs, a.pb_md]}>
                        <Trans>App Icon</Trans>
                      </SettingsList.ItemText>
                      <AppIconImage icon={icon} size={60} />
                    </View>
                  </SettingsList.LinkItem>
                </>
              )}
            </Animated.View>
          </SettingsList.Container>
        </Layout.Content>
      </Layout.Screen>
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
      </SettingsList.Group>
    </>
  )
}
