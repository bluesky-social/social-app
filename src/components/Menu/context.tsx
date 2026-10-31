import {createContext, useContext} from 'react'

import {type InlineItemPosition} from '#/components/Menu/inline/types'
import {type ContextType, type ItemContextType} from '#/components/Menu/types'

export const Context = createContext<ContextType | null>(null)
Context.displayName = 'MenuContext'

export const ItemContext = createContext<ItemContextType | null>(null)
ItemContext.displayName = 'MenuItemContext'

export const InlineItemPositionContext = createContext<InlineItemPosition>({
  index: 0,
  count: 1,
})
InlineItemPositionContext.displayName = 'MenuInlineItemPositionContext'

export function useMenuContext() {
  const context = useContext(Context)

  if (!context) {
    throw new Error('useMenuContext must be used within a Context.Provider')
  }

  return context
}

export function useMenuItemContext() {
  const context = useContext(ItemContext)

  if (!context) {
    throw new Error('useMenuItemContext must be used within a Context.Provider')
  }

  return context
}
