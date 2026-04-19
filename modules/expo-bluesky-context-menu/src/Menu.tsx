import {type ReactNode} from 'react'

import {tag} from './registry'

export type MenuProps = {
  children: ReactNode
}

/**
 * Sentinel: does not render. `Root` reads this element's children to collect
 * menu items.
 */
function MenuImpl(_: MenuProps): null {
  return null
}

export const Menu = tag(MenuImpl, 'menu')
