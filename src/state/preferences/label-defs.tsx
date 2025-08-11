import React from 'react'
import {
  type AppBskyLabelerDefs,
  type InterpretedLabelValueDefinition,
} from '@atproto/api'

import {useLabelDefinitionsQuery} from '../queries/preferences'

interface StateContext {
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
}

const stateContext = React.createContext<StateContext>({
  labelDefs: {},
  labelers: [],
})
stateContext.displayName = 'LabelDefsStateContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const state = useLabelDefinitionsQuery()
  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useLabelDefinitions() {
  return React.useContext(stateContext)
}
