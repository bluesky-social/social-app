import {type Action, type State} from '../state'

export function ViewMatches({}: {
  state: Extract<State, {step: '4: view matches'}>
  dispatch: React.Dispatch<Action>
}) {
  return null
}
