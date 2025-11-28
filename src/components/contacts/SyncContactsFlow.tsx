import {GetContacts} from './screens/GetContacts'
import {PhoneInput} from './screens/PhoneInput'
import {VerifyNumber} from './screens/VerifyNumber'
import {ViewMatches} from './screens/ViewMatches'
import {type Action, type State} from './state'

export function SyncContactsFlow({
  state,
  dispatch,
  onCancel,
  context = 'Standalone',
}: {
  state: State
  dispatch: React.Dispatch<Action>
  onCancel: () => void
  context: 'Onboarding' | 'Standalone'
}) {
  return (
    <>
      {state.step === '1: phone input' && (
        <PhoneInput
          state={state}
          dispatch={dispatch}
          showSkipButton={context === 'Onboarding'}
          onSkip={onCancel}
        />
      )}
      {state.step === '2: verify number' && (
        <VerifyNumber
          state={state}
          dispatch={dispatch}
          showSkipButton={context === 'Onboarding'}
          onSkip={onCancel}
        />
      )}
      {state.step === '3: get contacts' && (
        <GetContacts state={state} dispatch={dispatch} onCancel={onCancel} />
      )}
      {state.step === '4: view matches' && (
        <ViewMatches state={state} dispatch={dispatch} />
      )}
    </>
  )
}
