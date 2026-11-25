import {type tools} from '#/lexicons'

type Detail = tools.ozone.inbox.getActionedSubject.$OutputBody
type Action = tools.ozone.inbox.defs.ActionView

export function isAppealDecision(action: Action) {
  return [
    'contentRemoved',
    'accountSuspended',
    'accountTakedown',
    'labelApplied',
  ].includes(action.type)
}

export function currentAccountAction(data: Detail, actions: Action[]) {
  if (!('did' in data.subject)) return
  const type =
    data.enforcement.state === 'takendown'
      ? 'accountTakedown'
      : data.enforcement.state === 'suspended'
        ? 'accountSuspended'
        : undefined
  return type
    ? actions.find(action => action.type === type && !action.reversedAt)
    : undefined
}

export function appealAction(data: Detail, actions: Action[]) {
  if (
    'did' in data.subject &&
    (data.enforcement.state === 'takendown' ||
      data.enforcement.state === 'suspended')
  ) {
    return currentAccountAction(data, actions)
  }
  return actions.find(action => !action.reversedAt && isAppealDecision(action))
}

export function appealReference(data: Detail, action?: Action) {
  if (action) {
    return {
      $type: 'tools.ozone.inbox.appealActionedSubject#actionRef' as const,
      id: action.id,
    }
  }
  if (
    'did' in data.subject &&
    (data.enforcement.state === 'takendown' ||
      data.enforcement.state === 'suspended')
  ) {
    // Both temporary and permanent account restrictions use takedown events.
    return {
      $type: 'tools.ozone.inbox.appealActionedSubject#takedownRef' as const,
    }
  }
}
