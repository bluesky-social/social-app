import {tag} from './registry'
import {type MenuItemIconSource} from './types'

export type MenuItemIconProps = {
  icon: MenuItemIconSource
}

/**
 * Sentinel: does not render any React output. `Root` introspects this element
 * during its collection pass to pull the SVG path data off the icon component,
 * then ships the data to native.
 */
function MenuItemIconImpl(_: MenuItemIconProps): null {
  return null
}

export const MenuItemIcon = tag(MenuItemIconImpl, 'item-icon')
