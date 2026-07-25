import {createContext, useContext} from 'react'

import {
  type ContextType,
  type ItemContextType,
  type MenuContextType,
} from '#/components/ContextMenu/types'

export const Context = createContext<ContextType | null>(null)
Context.displayName = 'ContextMenuContext'

export const MenuContext = createContext<MenuContextType | null>(null)
MenuContext.displayName = 'ContextMenuMenuContext'

export const ItemContext = createContext<ItemContextType | null>(null)
ItemContext.displayName = 'ContextMenuItemContext'

export function useContextMenuContext() {
  const context = useContext(Context)

  if (!context) {
    throw new Error(
      'useContextMenuContext must be used within a Context.Provider',
    )
  }

  return context
}

export function useContextMenuMenuContext() {
  const context = useContext(MenuContext)

  if (!context) {
    throw new Error(
      'useContextMenuMenuContext must be used within a Context.Provider',
    )
  }

  return context
}

export function useContextMenuItemContext() {
  const context = useContext(ItemContext)

  if (!context) {
    throw new Error(
      'useContextMenuItemContext must be used within a Context.Provider',
    )
  }

  return context
}
