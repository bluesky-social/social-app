import type React from 'react'

import {type Gate} from './gates'

const fn = () => false
export function useGate(): (_gateName: Gate, _options?: any) => boolean {
  return fn
}

export function Provider({children}: {children: React.ReactNode}) {
  return children
}
