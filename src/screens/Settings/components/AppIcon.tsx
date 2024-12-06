import {useMemo} from 'react'
import {ImageSourcePropType} from 'react-native'
import {Alert} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as DynamicAppIcon from '@mozzius/expo-dynamic-app-icon'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {isAndroid} from '#/platform/detection'
import {atoms as a, platform, useTheme} from '#/alf'

export type AppIconSet = {
  id: string
  name: string
  iosImage: () => ImageSourcePropType
  androidImage: () => ImageSourcePropType
}

export function useAppIconSets() {
  const {_} = useLingui()

  return useMemo(() => {
    const defaults = [
      {
        id: 'default_light',
        name: _('Light'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_default_light.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_default_light.png`)
        },
      },
      {
        id: 'default_dark',
        name: _('Dark'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_default_dark.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_default_dark.png`)
        },
      },
    ] satisfies AppIconSet[]

    /**
     * Bluesky+
     */
    const core = [
      {
        id: 'core_aurora',
        name: _('Aurora'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_aurora.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_aurora.png`)
        },
      },
      // {
      //   id: 'core_bonfire',
      //   name: _('Bonfire'),
      //   iosImage: () => {
      //     return require(`../../../../assets/app-icons/ios_icon_core_bonfire.png`)
      //   },
      //   androidImage: () => {
      //     return require(`../../../../assets/app-icons/android_icon_core_bonfire.png`)
      //   },
      // },
      {
        id: 'core_sunrise',
        name: _('Sunrise'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_sunrise.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_sunrise.png`)
        },
      },
      {
        id: 'core_sunset',
        name: _('Sunset'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_sunset.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_sunset.png`)
        },
      },
      {
        id: 'core_midnight',
        name: _('Midnight'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_midnight.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_midnight.png`)
        },
      },
      {
        id: 'core_flat_blue',
        name: _('Flat Blue'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_flat_blue.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_flat_blue.png`)
        },
      },
      {
        id: 'core_flat_white',
        name: _('Flat White'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_flat_white.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_flat_white.png`)
        },
      },
      {
        id: 'core_flat_black',
        name: _('Flat Black'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_flat_black.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_flat_black.png`)
        },
      },
      {
        id: 'core_classic',
        name: _('Bluesky Classic™'),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_classic.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_classic.png`)
        },
      },
    ] satisfies AppIconSet[]

    return {
      defaults,
      core,
    }
  }, [_])
}

export function AppIcon({icon, size = 50}: {icon: AppIconSet; size: number}) {
  const {_} = useLingui()
  return (
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
                  DynamicAppIcon.setAppIcon(icon.id)
                },
                style: 'default',
              },
            ],
          )
        } else {
          DynamicAppIcon.setAppIcon(icon.id)
        }
      }}>
      <AppIconImage icon={icon} size={size} />
    </PressableScale>
  )
}

export function AppIconImage({
  icon,
  size = 50,
}: {
  icon: AppIconSet
  size: number
}) {
  const t = useTheme()
  return (
    <Image
      source={platform({
        ios: icon.iosImage(),
        android: icon.androidImage(),
      })}
      style={[
        {width: size, height: size},
        platform({
          ios: {borderRadius: size / 5},
          android: a.rounded_full,
        }),
        a.curve_continuous,
        t.atoms.border_contrast_medium,
        a.border,
      ]}
      accessibilityIgnoresInvertColors
    />
  )
}
