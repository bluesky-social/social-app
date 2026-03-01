import {createContext} from 'react'

export const AuthLayoutNavigationContext = createContext<{
  goBack: () => void
} | null>(null)
