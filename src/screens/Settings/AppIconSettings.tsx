import React from 'react'
import {Alert, View} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as AppIcon from '@mozzius/expo-dynamic-app-icon'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {isAndroid} from '#/platform/detection'
import {atoms as a, platform} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppIconSettings'>
export function AppIconSettingsScreen({}: Props) {
  const {_} = useLingui()
  const sets = useAppIconSets()

  return (
    <Layout.Screen>
      <Layout.Header title={_('App Icon')} />
      <Layout.Content
        contentContainerStyle={[a.py_2xl, a.px_xl, {paddingBottom: 100}]}>
        <Text style={[a.text_lg, a.font_heavy]}>Defaults</Text>
        <View style={[a.flex_row, a.flex_wrap]}>
          {sets.defaults.map(icon => (
            <View
              style={[{width: '50%'}, a.py_lg, a.px_xs, a.align_center]}
              key={icon.id}>
              <PressableScale
                accessibilityLabel={icon.name}
                accessibilityHint={_(msg`Tap to change app icon`)}
                targetScale={0.95}
                onPress={() => AppIcon.setAppIcon(icon.id)}>
                <Image
                  source={platform({
                    ios: icon.iosImage(),
                    android: icon.androidImage(),
                  })}
                  style={[
                    {width: 100, height: 100},
                    platform({
                      ios: {borderRadius: 20},
                      android: a.rounded_full,
                    }),
                    a.curve_continuous,
                  ]}
                  accessibilityIgnoresInvertColors
                />
              </PressableScale>
              <Text style={[a.text_center, a.font_bold, a.text_md, a.mt_md]}>
                {icon.name}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[a.text_lg, a.font_heavy]}>Bluesky+</Text>
        <View style={[a.flex_row, a.flex_wrap]}>
          {sets.core.map(icon => (
            <View
              style={[{width: '50%'}, a.py_lg, a.px_xs, a.align_center]}
              key={icon.id}>
              <PressableScale
                accessibilityLabel={icon.name}
                accessibilityHint={_(msg`Tap to change app icon`)}
                targetScale={0.95}
                onPress={() => {
                  if (isAndroid) {
                    Alert.alert(
                      _(msg`Change app icon to "${icon.name}"`),
                      _(msg`The app will be restarted`),
                      [
                        {
                          text: _(msg`Cancel`),
                          style: 'cancel',
                        },
                        {
                          text: _(msg`OK`),
                          onPress: () => {
                            AppIcon.setAppIcon(icon.id)
                          },
                          style: 'default',
                        },
                      ],
                    )
                  } else {
                    AppIcon.setAppIcon(icon.id)
                  }
                }}>
                <Image
                  source={platform({
                    ios: icon.iosImage(),
                    android: icon.androidImage(),
                  })}
                  style={[
                    {width: 100, height: 100},
                    platform({
                      ios: {borderRadius: 20},
                      android: a.rounded_full,
                    }),
                    a.curve_continuous,
                    a.shadow_lg,
                  ]}
                  accessibilityIgnoresInvertColors
                />
              </PressableScale>
              <Text
                style={[a.text_center, a.font_bold, a.text_md, a.mt_md]}
                // for Classic™
                emoji>
                {icon.name}
              </Text>
            </View>
          ))}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function useAppIconSets() {
  const {_} = useLingui()

  return React.useMemo(() => {
    const defaults = [
      {
        id: 'default_light',
        name: _('Light'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_default_light.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_default_light.png`)
        },
      },
      {
        id: 'default_dark',
        name: _('Dark'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_default_dark.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_default_dark.png`)
        },
      },
    ]

    /**
     * Bluesky+
     */
    const core = [
      {
        id: 'core_aurora',
        name: _('Aurora'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_aurora.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_aurora.png`)
        },
      },
      // {
      //   id: 'core_bonfire',
      //   name: _('Bonfire'),
      //   iosImage: () => {
      //     return require(`../../../assets/app-icons/ios_icon_core_bonfire.png`)
      //   },
      //   androidImage: () => {
      //     return require(`../../../assets/app-icons/android_icon_core_bonfire.png`)
      //   },
      // },
      {
        id: 'core_sunrise',
        name: _('Sunrise'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_sunrise.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_sunrise.png`)
        },
      },
      {
        id: 'core_sunset',
        name: _('Sunset'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_sunset.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_sunset.png`)
        },
      },
      {
        id: 'core_midnight',
        name: _('Midnight'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_midnight.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_midnight.png`)
        },
      },
      {
        id: 'core_flat_blue',
        name: _('Flat Blue'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_flat_blue.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_flat_blue.png`)
        },
      },
      {
        id: 'core_flat_white',
        name: _('Flat White'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_flat_white.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_flat_white.png`)
        },
      },
      {
        id: 'core_flat_black',
        name: _('Flat Black'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_flat_black.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_flat_black.png`)
        },
      },
      {
        id: 'core_classic',
        name: _('Bluesky Classic™'),
        iosImage: () => {
          return require(`../../../assets/app-icons/ios_icon_core_classic.png`)
        },
        androidImage: () => {
          return require(`../../../assets/app-icons/android_icon_core_classic.png`)
        },
      },
    ]

    return {
      defaults,
      core,
    }
  }, [_])
}
