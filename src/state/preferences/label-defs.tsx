import {createContext, useContext} from 'react'
import {type InterpretedLabelValueDefinition} from '@bsky.app/sdk/moderation'

import {type app} from '#/lexicons'
import {useLabelDefinitionsQuery} from '../queries/preferences'

interface StateContext {
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>
  labelers: app.bsky.labeler.defs.LabelerViewDetailed[]
}

const stateContext = createContext<StateContext>({
  labelDefs: {},
  labelers: [],
})
stateContext.displayName = 'LabelDefsStateContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const state = useLabelDefinitionsQuery()
  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useLabelDefinitions() {
  return useContext(stateContext)
}
