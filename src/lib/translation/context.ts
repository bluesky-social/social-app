import {createContext} from 'react'

import {type ContextType} from './types'

export const Context = createContext<ContextType | null>(null)
Context.displayName = 'TranslationContext'
