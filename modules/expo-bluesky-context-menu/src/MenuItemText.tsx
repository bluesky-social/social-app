import {tag} from './registry'

export type MenuItemTextProps = {
  children: string
}

/**
 * Sentinel: does not render. `Root` reads `children` as the menu item label.
 * Keeping this a sentinel (vs. a real Text) mirrors how `Menu.ItemText` is
 * used elsewhere while letting iOS draw the menu chrome natively.
 */
function MenuItemTextImpl(_: MenuItemTextProps): null {
  return null
}

export const MenuItemText = tag(MenuItemTextImpl, 'item-text')
