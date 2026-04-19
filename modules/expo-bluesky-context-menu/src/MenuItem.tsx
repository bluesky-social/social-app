import {type ReactNode} from 'react'

import {tag} from './registry'

export type MenuItemProps = {
  id: string
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
  /** Children must include a `MenuItemIcon` and a `MenuItemText`. */
  children: ReactNode
}

/**
 * Sentinel: does not render. `Root` walks the children tree to extract icon +
 * label, then ships a plain menu item spec to native.
 */
function MenuItemImpl(_: MenuItemProps): null {
  return null
}

export const MenuItem = tag(MenuItemImpl, 'item')
