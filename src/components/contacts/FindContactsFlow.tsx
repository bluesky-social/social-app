import {GetContacts} from './screens/GetContacts'
import {PhoneInput} from './screens/PhoneInput'
import {VerifyNumber} from './screens/VerifyNumber'
import {ViewMatches} from './screens/ViewMatches'
import {type Action, FindContactsGoBackContext, type State} from './state'

export function FindContactsFlow({
  state,
  dispatch,
  onBack,
  onCancel,
  context = 'Standalone',
}: {
  state: State
  dispatch: React.ActionDispatch<[Action]>
  onBack?: () => void
  onCancel: () => void
  context: 'Onboarding' | 'Standalone'
}) {
  return (
    <FindContactsGoBackContext value={onBack}>
      {state.step === '1: phone input' && (
        <PhoneInput
          state={state}
          dispatch={dispatch}
          context={context}
          onSkip={onCancel}
        />
      )}
      {state.step === '2: verify number' && (
        <VerifyNumber
          state={state}
          dispatch={dispatch}
          context={context}
          onSkip={onCancel}
        />
      )}
      {state.step === '3: get contacts' && (
        <GetContacts
          state={state}
          dispatch={dispatch}
          onCancel={onCancel}
          context={context}
        />
      )}
      {state.step === '4: view matches' && (
        <ViewMatches
          state={state}
          dispatch={dispatch}
          context={context}
          onNext={onCancel}
        />
      )}
    </FindContactsGoBackContext>
  )
}
