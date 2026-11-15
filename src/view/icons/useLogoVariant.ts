import {useKawaiiMode} from '#/state/preferences/kawaii'

export type LogoVariant = 'default' | 'kawaii'

export function useLogoVariant(allowVariants = true): LogoVariant {
  const kawaii = useKawaiiMode()

  if (!allowVariants) return 'default'
  if (kawaii) return 'kawaii'
  return 'default'
}
