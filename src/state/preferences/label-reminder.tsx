import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['labelReminderEnabled']
type SetContext = (v: persisted.Schema['labelReminderEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.labelReminderEnabled,
)
stateContext.displayName = 'LabelReminderStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['labelReminderEnabled']) => {},
)
setContext.displayName = 'LabelReminderSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('labelReminderEnabled'))

  const setStateWrapped = useCallback(
    (labelReminderEnabled: persisted.Schema['labelReminderEnabled']) => {
      setState(labelReminderEnabled)
      void persisted.write('labelReminderEnabled', labelReminderEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'labelReminderEnabled',
      nextLabelReminderEnabled => {
        setState(nextLabelReminderEnabled)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useLabelReminderEnabled() {
  return useContext(stateContext)
}

export function useSetLabelReminderEnabled() {
  return useContext(setContext)
}
