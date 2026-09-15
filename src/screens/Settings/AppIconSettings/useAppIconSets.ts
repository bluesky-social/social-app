import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {appIconImages} from '#/screens/Settings/AppIconSettings/appIconImages'
import {type AppIconSet} from '#/screens/Settings/AppIconSettings/types'

export function useAppIconSets() {
  const {_} = useLingui()

  return useMemo(() => {
    const defaults = [
      {
        id: 'default_light',
        name: _(msg({context: 'Name of app icon variant', message: 'Light'})),
        image: appIconImages.default_light,
      },
      {
        id: 'default_dark',
        name: _(msg({context: 'Name of app icon variant', message: 'Dark'})),
        image: appIconImages.default_dark,
      },
    ] satisfies AppIconSet[]

    /**
     * Bluesky+
     */
    const core = [
      {
        id: 'core_aurora',
        name: _(msg({context: 'Name of app icon variant', message: 'Aurora'})),
        image: appIconImages.core_aurora,
      },
      // {
      //   id: 'core_bonfire',
      //   name: _(msg({ context: 'Name of app icon variant', message: 'Bonfire' })),
      //   image: appIconImages.core_bonfire,
      // },
      {
        id: 'core_sunrise',
        name: _(msg({context: 'Name of app icon variant', message: 'Sunrise'})),
        image: appIconImages.core_sunrise,
      },
      {
        id: 'core_sunset',
        name: _(msg({context: 'Name of app icon variant', message: 'Sunset'})),
        image: appIconImages.core_sunset,
      },
      {
        id: 'core_midnight',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Midnight'}),
        ),
        image: appIconImages.core_midnight,
      },
      {
        id: 'core_flat_blue',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Flat Blue'}),
        ),
        image: appIconImages.core_flat_blue,
      },
      {
        id: 'core_flat_white',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Flat White'}),
        ),
        image: appIconImages.core_flat_white,
      },
      {
        id: 'core_flat_black',
        name: _(
          msg({context: 'Name of app icon variant', message: 'Flat Black'}),
        ),
        image: appIconImages.core_flat_black,
      },
      {
        id: 'core_classic',
        name: _(
          msg({
            context: 'Name of app icon variant',
            message: 'Bluesky Classic™',
          }),
        ),
        image: appIconImages.core_classic,
      },
    ] satisfies AppIconSet[]

    return {
      defaults,
      core,
    }
  }, [_])
}
