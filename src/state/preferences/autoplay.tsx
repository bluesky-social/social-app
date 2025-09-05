import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateVideoContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableVideoAutoplay),
)
stateVideoContext.displayName = 'AutoplayStateVideoContext'
const setVideoContext = React.createContext<SetContext>((_: boolean) => {})
setVideoContext.displayName = 'AutoplaySetVideoContext'

const stateGifContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableGifAutoplay),
)
stateGifContext.displayName = 'AutoplayStateGifContext'
const setGifContext = React.createContext<SetContext>((_: boolean) => {})
setGifContext.displayName = 'AutoplaySetGifContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [videoState, setVideoState] = React.useState(
    Boolean(persisted.get('disableVideoAutoplay')),
  )

  const setVideoStateWrapped = React.useCallback(
    (autoplayVideoDisabled: persisted.Schema['disableVideoAutoplay']) => {
      setVideoState(Boolean(autoplayVideoDisabled))
      persisted.write('disableVideoAutoplay', autoplayVideoDisabled)
    },
    [setVideoState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('disableVideoAutoplay', nextDisableVideoAutoplay => {
      setVideoState(Boolean(nextDisableVideoAutoplay))
    })
  }, [setVideoStateWrapped])


  const [gifState, setGifState] = React.useState(
    Boolean(persisted.get('disableGifAutoplay')),
  )

  const setGifStateWrapped = React.useCallback(
    (autoplayGifDisabled: persisted.Schema['disableGifAutoplay']) => {
      setGifState(Boolean(autoplayGifDisabled))
      persisted.write('disableGifAutoplay', autoplayGifDisabled)
    },
    [setGifState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('disableGifAutoplay', nextDisableGifAutoplay => {
      setGifState(Boolean(nextDisableGifAutoplay))
    })
  }, [setGifStateWrapped])

  return (
    <stateVideoContext.Provider value={videoState}>
      <setVideoContext.Provider value={setVideoStateWrapped}>
        <stateGifContext.Provider value={gifState}>
          <setGifContext.Provider value={setGifStateWrapped}>
            {children}
          </setGifContext.Provider>
        </stateGifContext.Provider>
      </setVideoContext.Provider>
    </stateVideoContext.Provider>
  )
}

export const useVideoAutoplayDisabled = () => React.useContext(stateVideoContext)
export const useSetVideoAutoplayDisabled = () => React.useContext(setVideoContext)

export const useGifAutoplayDisabled = () => React.useContext(stateGifContext)
export const useSetGifAutoplayDisabled = () => React.useContext(setGifContext)