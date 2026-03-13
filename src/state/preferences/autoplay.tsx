import {createContext, useContext, useEffect, useMemo, useState} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  videoAutoplayDisabled: persisted.Schema['disableVideoAutoplay']
  gifAutoplayDisabled: persisted.Schema['disableGifAutoplay']
}
type SetContext = {
  setVideoAutoplayDisabled: (
    v: persisted.Schema['disableVideoAutoplay'],
  ) => void
  setGifAutoplayDisabled: (v: persisted.Schema['disableGifAutoplay']) => void
}

const stateContext = createContext<StateContext>({
  videoAutoplayDisabled: Boolean(persisted.defaults.disableVideoAutoplay),
  gifAutoplayDisabled: Boolean(persisted.defaults.disableGifAutoplay),
})
stateContext.displayName = 'AutoplayStateContext'
const setContext = createContext<SetContext>({} as SetContext)
setContext.displayName = 'AutoplaySetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [videoAutoplayDisabled, setVideoAutoplayDisabled] = useState(
    persisted.get('disableVideoAutoplay'),
  )
  const [gifAutoplayDisabled, setGifAutoplayDisabled] = useState(
    persisted.get('disableGifAutoplay'),
  )

  const stateContextValue = useMemo(
    () => ({
      videoAutoplayDisabled,
      gifAutoplayDisabled,
    }),
    [videoAutoplayDisabled, gifAutoplayDisabled],
  )

  const setContextValue = useMemo(
    () => ({
      setVideoAutoplayDisabled: (
        _videoAutoplayDisabled: persisted.Schema['disableVideoAutoplay'],
      ) => {
        setVideoAutoplayDisabled(_videoAutoplayDisabled)
        persisted.write('disableVideoAutoplay', _videoAutoplayDisabled)
      },
      setGifAutoplayDisabled: (
        _gifAutoplayDisabled: persisted.Schema['disableGifAutoplay'],
      ) => {
        setGifAutoplayDisabled(_gifAutoplayDisabled)
        persisted.write('disableGifAutoplay', _gifAutoplayDisabled)
      },
    }),
    [],
  )

  useEffect(() => {
    const unsub1 = persisted.onUpdate(
      'disableVideoAutoplay',
      nextVideoAutoplayState => {
        setVideoAutoplayDisabled(nextVideoAutoplayState)
      },
    )
    const unsub2 = persisted.onUpdate(
      'disableGifAutoplay',
      nextGifAutoplayState => {
        setGifAutoplayDisabled(nextGifAutoplayState)
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
