import {createContext} from 'react'

import type {ContextType} from '#/components/Menu/types'

export const Context = createContext<ContextType>({
  // @ts-ignore
  control: null,
})
