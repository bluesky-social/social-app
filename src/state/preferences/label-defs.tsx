import {createContext, PropsWithChildren, useContext} from 'react'
import {AppBskyLabelerDefs, InterpretedLabelValueDefinition} from '@atproto/api'

import {useLabelDefinitionsQuery} from '../queries/preferences'

interface StateContext {
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>
  labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
}

const stateContext = createContext<StateContext>({
  labelDefs: {},
  labelers: [],
})

export function Provider({children}: PropsWithChildren<{}>) {
  const state = useLabelDefinitionsQuery()
  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useLabelDefinitions() {
  return useContext(stateContext)
}
