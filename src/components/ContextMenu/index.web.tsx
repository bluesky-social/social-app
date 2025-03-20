import {AuxilaryViewProps} from './types'

export * from '#/components/Menu'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

// native only
export function AuxilaryView({}: AuxilaryViewProps) {
  return null
}
