import React from 'react'
import {
  type AppGndrLabelerDefs,
  type InterpretedLabelValueDefinition,
} from '@gander-social-atproto/api'

import {useLabelDefinitionsQuery} from '../queries/preferences'

interface StateContext {
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>
  labelers: AppGndrLabelerDefs.LabelerViewDetailed[]
}

const stateContext = React.createContext<StateContext>({
  labelDefs: {},
  labelers: [],
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const state = useLabelDefinitionsQuery()
  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useLabelDefinitions() {
  return React.useContext(stateContext)
}
