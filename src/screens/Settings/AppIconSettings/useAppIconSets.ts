import {useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AppIconSet} from '#/screens/Settings/AppIconSettings/types'

export function useAppIconSets() {
  const {_} = useLingui()

  return useMemo(() => {
    const defaults = [
      {
        id: 'default_light',
        name: _(msg({context: 'Name of app icon variant', message: 'Light'})),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_default_light.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_default_light.png`)
        },
      },
      {
        id: 'default_dark',
        name: _(msg({context: 'Name of app icon variant', message: 'Dark'})),
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
        name: _(msg({context: 'Name of app icon variant', message: 'Aurora'})),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_aurora.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_aurora.png`)
        },
      },
      // {
      //   id: 'core_bonfire',
      //   name: _(msg({ context: 'Name of app icon variant', message: 'Bonfire' })),
      //   iosImage: () => {
      //     return require(`../../../../assets/app-icons/ios_icon_core_bonfire.png`)
      //   },
      //   androidImage: () => {
      //     return require(`../../../../assets/app-icons/android_icon_core_bonfire.png`)
      //   },
      // },
      {
        id: 'core_sunrise',
        name: _(msg({context: 'Name of app icon variant', message: 'Sunrise'})),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_sunrise.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_sunrise.png`)
        },
      },
      {
        id: 'core_sunset',
        name: _(msg({context: 'Name of app icon variant', message: 'Sunset'})),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_sunset.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_sunset.png`)
        },
      },
      {
        id: 'core_midnight',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Midnight'}),
        ),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_midnight.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_midnight.png`)
        },
      },
      {
        id: 'core_flat_blue',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Flat Blue'}),
        ),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_flat_blue.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_flat_blue.png`)
        },
      },
      {
        id: 'core_flat_white',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Flat White'}),
        ),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_flat_white.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_flat_white.png`)
        },
      },
      {
        id: 'core_flat_black',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Flat Black'}),
        ),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_core_flat_black.png`)
        },
        androidImage: () => {
          return require(`../../../../assets/app-icons/android_icon_core_flat_black.png`)
        },
      },
      {
        id: 'core_classic',
        name: _(
          msg({
            context: 'Name of app icon variant',
            message: 'Bluesky Classic™',
          }),
        ),
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
