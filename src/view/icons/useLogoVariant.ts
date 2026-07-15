import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useAnalytics} from '#/analytics'
import {useGeolocation} from '#/geolocation'

export type LogoVariant = 'default' | 'japan' | 'kawaii'

export function useLogoVariant(): LogoVariant {
  const ax = useAnalytics()
  const geolocation = useGeolocation()
  const kawaii = useKawaiiMode()
  const japanLogoEnabled =
    geolocation.countryCode === 'JP' &&
    ax.features.enabled(ax.features.CustomLogoJapanEnable)

  if (japanLogoEnabled) return 'japan'
  if (kawaii) return 'kawaii'
  return 'default'
}
