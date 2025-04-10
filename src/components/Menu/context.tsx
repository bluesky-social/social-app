import React from 'react'

import type {ContextType, ItemContextType} from '#/components/Menu/types'

export const Context = React.createContext<ContextType | null>(null)

export const ItemContext = React.createContext<ItemContextType | null>(null)

export function useMenuContext() {
  const context = React.useContext(Context)

  if (!context) {
    throw new Error('useMenuContext must be used within a Context.Provider')
  }

  return context
}

export function useMenuItemContext() {
  const context = React.useContext(ItemContext)

  if (!context) {
    throw new Error('useMenuItemContext must be used within a Context.Provider')
  }

  return context
}
