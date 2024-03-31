import React from 'react'

import type {ContextType} from '#/components/Menu/types'

export const Context = React.createContext<ContextType>({
  // @ts-ignore
  control: null,
})
