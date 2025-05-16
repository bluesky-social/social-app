import React from 'react'

import * as persisted from '#/state/persisted'

type StateVideoContext = boolean
type SetVideoContext = (v: boolean) => void

type StateGifContext = boolean
type SetGifContext = (v: boolean) => void

const stateVideoContext = React.createContext<StateVideoContext>(
  Boolean(persisted.defaults.disableVideoAutoplay),
)
const setVideoContext = React.createContext<SetVideoContext>((_: boolean) => {})

const stateGifContext = React.createContext<StateGifContext>(
  Boolean(persisted.defaults.disableGifAutoplay),
)
const setGifContext = React.createContext<SetGifContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [videoState, setVideoState] = React.useState(
    Boolean(persisted.get('disableVideoAutoplay')),
  )

  const [gifState, setGifState] = React.useState(
    Boolean(persisted.get('disableGifAutoplay')),
  )

  const setVideoStateWrapped = React.useCallback(
    (videoAutoplayDisabled: persisted.Schema['disableVideoAutoplay']) => {
      setVideoState(Boolean(videoAutoplayDisabled))
      persisted.write('disableVideoAutoplay', videoAutoplayDisabled)
    },
    [setVideoState],
  )

  const setGifStateWrapped = React.useCallback(
    (gifAutoplayDisabled: persisted.Schema['disableGifAutoplay']) => {
      setGifState(Boolean(gifAutoplayDisabled))
      persisted.write('disableGifAutoplay', gifAutoplayDisabled)
    },
    [setGifState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('disableVideoAutoplay', nextDisableVideoAutoplay => {
      setVideoState(Boolean(nextDisableVideoAutoplay))
    })
  }, [setVideoStateWrapped])

  React.useEffect(() => {
    return persisted.onUpdate('disableGifAutoplay', nextDisableGifAutoplay => {
      setGifState(Boolean(nextDisableGifAutoplay))
    })
  }, [setGifStateWrapped])


  return (
    <stateGifContext.Provider value={gifState}>
      <setGifContext.Provider value={setGifStateWrapped}>
        <stateVideoContext.Provider value={videoState}>
          <setVideoContext.Provider value={setVideoStateWrapped}>
            {children}
          </setVideoContext.Provider>
        </stateVideoContext.Provider>
      </setGifContext.Provider>
    </stateGifContext.Provider>
  )
}

export const useVideoAutoplayDisabled = () => React.useContext(stateVideoContext)
export const useSetVideoAutoplayDisabled = () => React.useContext(setVideoContext)

export const useGifAutoplayDisabled = () => React.useContext(stateGifContext)
export const useSetGifAutoplayDisabled = () => React.useContext(setGifContext)
