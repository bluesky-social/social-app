import {type Action, type State} from './state'

export function FindContactsFlow(_props: {
  state: State
  dispatch: React.ActionDispatch<[Action]>
  onBack?: () => void
  onCancel: () => void
  context: 'Onboarding' | 'Standalone'
}): never {
  throw new Error('FindContactsFlow is not available on web')
}
