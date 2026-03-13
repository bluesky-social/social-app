import {
  createContext, 
  useContext, 
  useEffect, 
  useState,
  useMemo, 
} from 'react'

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

const stateContext = createContext<StateContext>({
  videoAutoplayState: Boolean(persisted.defaults.disableVideoAutoplay),
  gifAutoplayState: Boolean(persisted.defaults.disableGifAutoplay),
})
stateContext.displayName = 'AutoplayStateContext'
const setContext = createContext<SetContext>({} as SetContext)
setContext.displayName = 'AutoplaySetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [videoAutoplayState, setVideoAutoplayState] = useState(
    persisted.get('disableVideoAutoplay'),
  )
  const [gifAutoplayState, setGifAutoplayState] = useState(
    persisted.get('disableGifAutoplay'),
  )

  const stateContextValue = useMemo(
    () => ({
      videoAutoplayState,
      gifAutoplayState,
    }),
    [videoAutoplayState, gifAutoplayState],
  )

  const setContextValue = useMemo(
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

  useEffect(() => {
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
  return useContext(stateContext)
}

export function useSetAutoplayDisabledPref() {
  return useContext(setContext)
}