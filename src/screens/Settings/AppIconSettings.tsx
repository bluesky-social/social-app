import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as AppIcon from '@mozzius/expo-dynamic-app-icon'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {isIOS} from '#/platform/detection'
import {atoms as a, platform} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

enum Platform {
  iOS = 'ios',
  Android = 'android',
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppIconSettings'>
export function AppIconSettingsScreen({}: Props) {
  const {_} = useLingui()
  const sets = useAppIconSets()

  return (
    <Layout.Screen>
      <Layout.Header title={_('App Icon')} />
      <Layout.Content contentContainerStyle={[a.py_2xl, a.px_xl]}>
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
                  source={icon.image()}
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
                onPress={() => AppIcon.setAppIcon(icon.id)}>
                <Image
                  source={icon.image()}
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
      </Layout.Content>
    </Layout.Screen>
  )
}

function useAppIconSets() {
  const {_} = useLingui()

  return React.useMemo(() => {
    const defaults = [
      {
        id: 'ios_icon_default_light',
        platform: Platform.iOS,
        name: _('Light'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_default_light.png`)
        },
      },
      {
        id: 'ios_icon_default_dark',
        platform: Platform.iOS,
        name: _('Dark'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_default_dark.png`)
        },
      },
      {
        id: 'android_icon_default_light',
        platform: Platform.Android,
        name: _('Light'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_default_light.png`)
        },
      },
      {
        id: 'android_icon_default_dark',
        platform: Platform.Android,
        name: _('Dark'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_default_dark.png`)
        },
      },
    ].filter(icon =>
      isIOS
        ? icon.platform === Platform.iOS
        : icon.platform === Platform.Android,
    )

    /**
     * Bluesky+
     */
    const core = [
      {
        id: 'ios_icon_core_aurora',
        platform: Platform.iOS,
        name: _('Aurora'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_aurora.png`)
        },
      },
      // {
      //   id: 'ios_icon_core_bonfire',
      //   platform: Platform.iOS,
      //   name: _('Bonfire'),
      //   image: () => {
      //     return require(`../../../assets/app-icons/ios_icon_core_bonfire.png`)
      //   },
      // },
      {
        id: 'ios_icon_core_sunrise',
        platform: Platform.iOS,
        name: _('Sunrise'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_sunrise.png`)
        },
      },
      {
        id: 'ios_icon_core_sunset',
        platform: Platform.iOS,
        name: _('Sunset'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_sunset.png`)
        },
      },
      {
        id: 'ios_icon_core_midnight',
        platform: Platform.iOS,
        name: _('Midnight'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_midnight.png`)
        },
      },
      {
        id: 'ios_icon_core_flat_blue',
        platform: Platform.iOS,
        name: _('Flat Blue'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_flat_blue.png`)
        },
      },
      {
        id: 'ios_icon_core_flat_white',
        platform: Platform.iOS,
        name: _('Flat White'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_flat_white.png`)
        },
      },
      {
        id: 'ios_icon_core_flat_black',
        platform: Platform.iOS,
        name: _('Flat Black'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_flat_black.png`)
        },
      },
      {
        id: 'ios_icon_core_classic',
        platform: Platform.iOS,
        name: _('Bluesky Classic™'),
        image: () => {
          return require(`../../../assets/app-icons/ios_icon_core_classic.png`)
        },
      },

      {
        id: 'android_icon_core_aurora',
        platform: Platform.Android,
        name: _('Aurora'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_aurora.png`)
        },
      },
      // {
      //   id: 'android_icon_core_bonfire',
      //   platform: Platform.Android,
      //   name: _('Bonfire'),
      //   image: () => {
      //     return require(`../../../assets/app-icons/android_icon_core_bonfire.png`)
      //   },
      // },
      {
        id: 'android_icon_core_sunrise',
        platform: Platform.Android,
        name: _('Sunrise'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_sunrise.png`)
        },
      },
      {
        id: 'android_icon_core_sunset',
        platform: Platform.Android,
        name: _('Sunset'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_sunset.png`)
        },
      },
      {
        id: 'android_icon_core_midnight',
        platform: Platform.Android,
        name: _('Midnight'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_midnight.png`)
        },
      },
      {
        id: 'android_icon_core_flat_blue',
        platform: Platform.Android,
        name: _('Flat Blue'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_flat_blue.png`)
        },
      },
      {
        id: 'android_icon_core_flat_white',
        platform: Platform.Android,
        name: _('Flat White'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_flat_white.png`)
        },
      },
      {
        id: 'android_icon_core_flat_black',
        platform: Platform.Android,
        name: _('Flat Black'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_flat_black.png`)
        },
      },
      {
        id: 'android_icon_core_classic',
        platform: Platform.Android,
        name: _('Bluesky Classic™'),
        image: () => {
          return require(`../../../assets/app-icons/android_icon_core_classic.png`)
        },
      },
    ].filter(icon =>
      isIOS
        ? icon.platform === Platform.iOS
        : icon.platform === Platform.Android,
    )

    return {
      defaults,
      core,
    }
  }, [_])
}
