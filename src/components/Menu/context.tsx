import React from 'react'

import type {ContextType, ItemContextType} from '#/components/Menu/types'

export const Context = React.createContext<ContextType>({
  // @ts-ignore
  control: null,
})

export const ItemContext = React.createContext<ItemContextType>({
  disabled: false,
})
