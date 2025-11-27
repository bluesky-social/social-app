import {useState} from 'react'

import {ScreenTransition} from '#/components/ScreenTransition'
import {type Action, type State} from './state'

export function SyncContactsFlow({
  state,
}: {
  state: State
  dispatch: React.Dispatch<Action>
}) {
  const [transitionDirection, _setTransitionDirection] = useState<
    'Forward' | 'Backward'
  >('Forward')

  return (
    <ScreenTransition direction={transitionDirection} key={state.step}>
      <></>
    </ScreenTransition>
  )
}
