import {Icon, toast} from '#/components/Toast'

/**
 * @deprecated Use `toast` from '#/components/Toast'
 */
export function show(message: string, legacyIcon?: Icon.LegacyIconName) {
  toast({message, icon: Icon.compat_convertLegacyIcon(legacyIcon)})
}
