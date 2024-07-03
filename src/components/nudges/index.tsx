import React from 'react'

import {Nudge} from '#/components/nudges/types'

export * from '#/components/nudges/types'

export type Context = {
  nudges: Nudge[]
  activateNudges: (nudges: Nudge[]) => Promise<void>
  updateNudges: (nudges: Nudge[]) => Promise<void>
  dismissNudges: (nudges: Nudge[]) => Promise<void>
}

const Context = React.createContext<Context>({
  nudges: [],
  activateNudges: async () => {},
  updateNudges: async () => {},
  dismissNudges: async () => {},
})

export function useNudges() {
  return React.useContext(Context)
}

export function NudgeProvider({children}: {children: React.ReactNode}) {
  // TODO hydrate from remote storage
  const [nudges, setNudges] = React.useState<Nudge[]>([])

  const activateNudges = async (nudges: Nudge[]) => {
    setNudges(s => Array.from(new Set([...s, ...nudges])))
    // TODO write to remote storage
  }

  const updateNudges = async (nudges: Nudge[]) => {
    setNudges(s => [
      ...s.filter(n => !nudges.some(nudge => nudge.type === n.type)),
      ...nudges,
    ])
    // TODO write to remote storage
  }

  const dismissNudges = async (nudges: Nudge[]) => {
    setNudges(s => s.filter(n => !nudges.some(nudge => nudge.type === n.type)))
    // TODO write to remote storage
  }

  const ctx = React.useMemo<Context>(
    () => ({nudges, activateNudges, updateNudges, dismissNudges}),
    [nudges],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
