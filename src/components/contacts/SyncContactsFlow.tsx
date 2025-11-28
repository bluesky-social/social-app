import {useState} from 'react'

import {ScreenTransition} from '#/components/ScreenTransition'
import {GetContacts} from './screens/GetContacts'
import {PhoneInput} from './screens/PhoneInput'
import {VerifyNumber} from './screens/VerifyNumber'
import {ViewMatches} from './screens/ViewMatches'
import {type Action, type State} from './state'

export function SyncContactsFlow({
  state,
  dispatch,
  onSkip,
  context = 'Standalone',
}: {
  state: State
  dispatch: React.Dispatch<Action>
  onSkip: () => void
  context: 'Onboarding' | 'Standalone'
}) {
  const [transitionDirection, _setTransitionDirection] = useState<
    'Forward' | 'Backward'
  >('Forward')

  return (
    <ScreenTransition direction={transitionDirection} key={state.step}>
      {state.step === '1: phone input' && (
        <PhoneInput
          state={state}
          dispatch={dispatch}
          showSkipButton={context === 'Onboarding'}
          onSkip={onSkip}
        />
      )}
      {state.step === '2: verify number' && (
        <VerifyNumber state={state} dispatch={dispatch} />
      )}
      {state.step === '3: get contacts' && (
        <GetContacts state={state} dispatch={dispatch} />
      )}
      {state.step === '4: view matches' && (
        <ViewMatches state={state} dispatch={dispatch} />
      )}
    </ScreenTransition>
  )
}
