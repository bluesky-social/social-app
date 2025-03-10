import {useMemo} from 'react'
import {Props as FontAwesomeProps} from '@fortawesome/react-native-fontawesome'
import type {SFSymbol} from 'sf-symbols-typescript'

import {useTheme} from '#/alf'
import {Props as SVGIconProps} from '#/components/icons/common'
import {CircleCheck_Stroke2_Corner0_Rounded} from '../icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded} from '../icons/CircleInfo'
import {Clipboard_Stroke2_Corner2_Rounded} from '../icons/Clipboard'
import {TimesLarge_Stroke2_Corner0_Rounded} from '../icons/Times'
import {Warning_Stroke2_Corner0_Rounded} from '../icons/Warning'

export type IconName = 'check' | 'error' | 'warning' | 'info' | 'copied'

export type LegacyIconName = Extract<
  FontAwesomeProps['icon'],
  | 'xmark'
  | 'check'
  | 'clipboard-check'
  | 'warning'
  | 'info'
  | 'circle-exclamation'
  | 'exclamation-circle'
>

/**
 * Get new icon name from legacy fontawesome icon
 */
export const compat_convertLegacyIcon = (icon?: LegacyIconName): IconName => {
  switch (icon) {
    case undefined:
    case 'check':
      return 'check'
    case 'xmark':
      return 'error'
    case 'clipboard-check':
      return 'copied'
    case 'warning':
    case 'exclamation-circle':
    case 'circle-exclamation':
      return 'warning'
    case 'info':
      return 'info'
    default:
      throw new Error(`Unknown icon: ${icon}`)
  }
}

function getComponent(name: IconName) {
  switch (name) {
    case 'check':
      return CircleCheck_Stroke2_Corner0_Rounded
    case 'error':
      return TimesLarge_Stroke2_Corner0_Rounded
    case 'warning':
      return Warning_Stroke2_Corner0_Rounded
    case 'info':
      return CircleInfo_Stroke2_Corner0_Rounded
    case 'copied':
      return Clipboard_Stroke2_Corner2_Rounded
    default:
      throw new Error(`Unknown icon: ${name}`)
  }
}

export function ToastIcon({
  icon,
  style,
  ...props
}: {icon: IconName} & SVGIconProps) {
  const t = useTheme()
  const Component = useMemo(() => getComponent(icon), [icon])
  return <Component style={[t.atoms.text_contrast_medium, style]} {...props} />
}

export function getSfSymbol(name: IconName): SFSymbol {
  switch (name) {
    case 'check':
      return 'checkmark.circle.fill'
    case 'error':
      return 'xmark.circle.fill'
    case 'warning':
      return 'exclamationmark.triangle.fill'
    case 'info':
      return 'info.circle.fill'
    case 'copied':
      return 'doc.on.clipboard.fill'
    default:
      throw new Error(`Unknown icon: ${name}`)
  }
}
