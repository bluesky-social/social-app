import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {type AppIconSet} from '#/screens/Settings/AppIconSettings/types'

export function useAppIconSets() {
  const {_} = useLingui()

  return useMemo(() => {
    const defaults = [
      {
        id: 'default_light',
        name: _(msg({context: 'Name of app icon variant', message: 'Light'})),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_legacy_light.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_legacy_light.png`,
          )
        },
      },
      {
        id: 'default_dark',
        name: _(msg({context: 'Name of app icon variant', message: 'Dark'})),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_legacy_dark.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_legacy_dark.png`,
          )
        },
      },
    ] satisfies AppIconSet[]

    return {
      defaults,
    }
  }, [_])
}
