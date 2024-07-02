import React from 'react'
import {InteractionManager} from 'react-native'
import {TourGuideProvider, useTourGuideController} from 'rn-tourguide'

import {useGate} from '#/lib/statsig/statsig'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {HomeTour} from './HomeTour'
import {TooltipComponent} from './Tooltip'

export enum TOURS {
  HOME = 'home',
}

type StateContext = TOURS | null
type SetContext = (v: TOURS | null) => void

const stateContext = React.createContext<StateContext>(null)
const setContext = React.createContext<SetContext>((_: TOURS | null) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const theme = useColorModeTheme()
  const [state, setState] = React.useState<TOURS | null>(() => null)

  return (
    <TourGuideProvider
      androidStatusBarVisible
      tooltipComponent={TooltipComponent}
      backdropColor={
        theme === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.8)'
      }
      preventOutsideInteraction>
      <stateContext.Provider value={state}>
        <setContext.Provider value={setState}>
          <HomeTour />
          {children}
        </setContext.Provider>
      </stateContext.Provider>
    </TourGuideProvider>
  )
}

export function useTriggerTourIfQueued(tour: TOURS) {
  const {start} = useTourGuideController(tour)
  const setQueuedTour = React.useContext(setContext)
  const queuedTour = React.useContext(stateContext)
  const gate = useGate()

  return React.useCallback(() => {
    if (queuedTour === tour) {
      setQueuedTour(null)
      InteractionManager.runAfterInteractions(() => {
        if (gate('new_user_guided_tour')) {
          start()
        }
      })
    }
  }, [tour, queuedTour, setQueuedTour, start, gate])
}

export function useSetQueuedTour() {
  return React.useContext(setContext)
}
