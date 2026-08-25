import {type Action, type State} from '#/components/contacts/state'

export function StepFindContacts(_props: {
  flowState: State
  flowDispatch: React.ActionDispatch<[Action]>
}): never {
  throw new Error('StepFindContacts is not available on web')
}
