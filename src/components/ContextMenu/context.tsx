import React from 'react'

import {
  type ContextType,
  type ItemContextType,
  type MenuContextType,
} from '#/components/ContextMenu/types'

export const Context = React.createContext<ContextType | null>(null)

export const MenuContext = React.createContext<MenuContextType | null>(null)

export const ItemContext = React.createContext<ItemContextType | null>(null)

export function useContextMenuContext() {
  const context = React.useContext(Context)

  if (!context) {
    throw new Error(
      'useContextMenuContext must be used within a Context.Provider',
    )
  }

  return context
}

export function useContextMenuMenuContext() {
  const context = React.useContext(MenuContext)

  if (!context) {
    throw new Error(
      'useContextMenuMenuContext must be used within a Context.Provider',
    )
  }

  return context
}

export function useContextMenuItemContext() {
  const context = React.useContext(ItemContext)

  if (!context) {
    throw new Error(
      'useContextMenuItemContext must be used within a Context.Provider',
    )
  }

  return context
}
