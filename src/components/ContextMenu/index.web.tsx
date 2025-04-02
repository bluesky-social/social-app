import {type AuxiliaryViewProps} from './types'

export * from '#/components/Menu'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

// native only
export function AuxiliaryView({}: AuxiliaryViewProps) {
  return null
}
