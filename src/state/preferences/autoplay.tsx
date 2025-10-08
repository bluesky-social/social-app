import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  videoAutoplayState: persisted.Schema['disableVideoAutoplay']
  gifAutoplayState: persisted.Schema['disableGifAutoplay']
}
type SetContext = {
  setVideoAutoplayDisabled: (
    v: persisted.Schema['disableVideoAutoplay'],
  ) => void
  setGifAutoplayDisabled: (v: persisted.Schema['disableGifAutoplay']) => void
}

const stateContext = React.createContext<StateContext>({
  videoAutoplayState: true,
  gifAutoplayState: true,
})
stateContext.displayName = 'AutoplayStateContext'
const setContext = React.createContext<SetContext>({} as SetContext)
setContext.displayName = 'AutoplaySetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [videoAutoplayState, setVideoAutoplayState] = React.useState(
    persisted.get('disableVideoAutoplay'),
  )
  const [gifAutoplayState, setGifAutoplayState] = React.useState(
    persisted.get('disableGifAutoplay'),
  )

  const stateContextValue = React.useMemo(
    () => ({
      videoAutoplayState,
      gifAutoplayState,
    }),
    [videoAutoplayState, gifAutoplayState],
  )

  const setContextValue = React.useMemo(
    () => ({
      setVideoAutoplayDisabled: (
        _videoAutoplayState: persisted.Schema['disableVideoAutoplay'],
      ) => {
        setVideoAutoplayState(_videoAutoplayState)
        persisted.write('disableVideoAutoplay', _videoAutoplayState)
      },
      setGifAutoplayDisabled: (
        _gifAutoplayState: persisted.Schema['disableGifAutoplay'],
      ) => {
        setGifAutoplayState(_gifAutoplayState)
        persisted.write('disableGifAutoplay', _gifAutoplayState)
      },
    }),
    [],
  )

  React.useEffect(() => {
    const unsub1 = persisted.onUpdate(
      'disableVideoAutoplay',
      nextVideoAutoplayState => {
        setVideoAutoplayState(nextVideoAutoplayState)
      },
    )
    const unsub2 = persisted.onUpdate(
      'disableGifAutoplay',
      nextGifAutoplayState => {
        setGifAutoplayState(nextGifAutoplayState)
      },
    )
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  return (
    <stateContext.Provider value={stateContextValue}>
      <setContext.Provider value={setContextValue}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useAutoplayDisabledPref() {
  return React.useContext(stateContext)
}

export function useSetAutoplayDisabledPref() {
  return React.useContext(setContext)
}
