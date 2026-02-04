import React from 'react'

import * as persisted from '#/state/persisted'

type BlurFromNonFollowsStateContext = boolean
type BlurFromNonFollowsSetContext = (v: boolean) => void
type AlwaysBlurStateContext = boolean
type AlwaysBlurSetContext = (v: boolean) => void

const blurFromNonFollowsStateContext =
  React.createContext<BlurFromNonFollowsStateContext>(
    Boolean(persisted.defaults.dmImageBlurFromNonFollows),
  )
blurFromNonFollowsStateContext.displayName =
  'DmImageBlurFromNonFollowsStateContext'

const blurFromNonFollowsSetContext =
  React.createContext<BlurFromNonFollowsSetContext>((_: boolean) => {})
blurFromNonFollowsSetContext.displayName = 'DmImageBlurFromNonFollowsSetContext'

const alwaysBlurStateContext = React.createContext<AlwaysBlurStateContext>(
  Boolean(persisted.defaults.dmImageAlwaysBlur),
)
alwaysBlurStateContext.displayName = 'DmImageAlwaysBlurStateContext'

const alwaysBlurSetContext = React.createContext<AlwaysBlurSetContext>(
  (_: boolean) => {},
)
alwaysBlurSetContext.displayName = 'DmImageAlwaysBlurSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [blurFromNonFollowsState, setBlurFromNonFollowsState] = React.useState(
    Boolean(persisted.get('dmImageBlurFromNonFollows')),
  )
  const [alwaysBlurState, setAlwaysBlurState] = React.useState(
    Boolean(persisted.get('dmImageAlwaysBlur')),
  )

  const setBlurFromNonFollowsWrapped = React.useCallback(
    (value: persisted.Schema['dmImageBlurFromNonFollows']) => {
      setBlurFromNonFollowsState(Boolean(value))
      void persisted.write('dmImageBlurFromNonFollows', value)
    },
    [setBlurFromNonFollowsState],
  )

  const setAlwaysBlurWrapped = React.useCallback(
    (value: persisted.Schema['dmImageAlwaysBlur']) => {
      setAlwaysBlurState(Boolean(value))
      void persisted.write('dmImageAlwaysBlur', value)
    },
    [setAlwaysBlurState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('dmImageBlurFromNonFollows', nextValue => {
      setBlurFromNonFollowsState(Boolean(nextValue))
    })
  }, [setBlurFromNonFollowsWrapped])

  React.useEffect(() => {
    return persisted.onUpdate('dmImageAlwaysBlur', nextValue => {
      setAlwaysBlurState(Boolean(nextValue))
    })
  }, [setAlwaysBlurWrapped])

  return (
    <blurFromNonFollowsStateContext.Provider value={blurFromNonFollowsState}>
      <blurFromNonFollowsSetContext.Provider
        value={setBlurFromNonFollowsWrapped}>
        <alwaysBlurStateContext.Provider value={alwaysBlurState}>
          <alwaysBlurSetContext.Provider value={setAlwaysBlurWrapped}>
            {children}
          </alwaysBlurSetContext.Provider>
        </alwaysBlurStateContext.Provider>
      </blurFromNonFollowsSetContext.Provider>
    </blurFromNonFollowsStateContext.Provider>
  )
}

export const useDmImageBlurFromNonFollows = () =>
  React.useContext(blurFromNonFollowsStateContext)
export const useSetDmImageBlurFromNonFollows = () =>
  React.useContext(blurFromNonFollowsSetContext)
export const useDmImageAlwaysBlur = () =>
  React.useContext(alwaysBlurStateContext)
export const useSetDmImageAlwaysBlur = () =>
  React.useContext(alwaysBlurSetContext)
