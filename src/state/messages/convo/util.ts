import {
  ConvoState,
  ConvoStateBackgrounded,
  ConvoStateDisabled,
  ConvoStateReady,
  ConvoStateSuspended,
  ConvoStatus,
} from './types'

/**
 * States where the convo is ready to be used - either ready, or backgrounded/suspended
 * and ready to be resumed
 */
export type ActiveConvoStates =
  | ConvoStateReady
  | ConvoStateBackgrounded
  | ConvoStateSuspended
  | ConvoStateDisabled

/**
 * Checks if a `Convo` has a `status` that is "active", meaning the chat is
 * loaded and ready to be used, or its in a suspended or background state, and
 * ready for resumption.
 */
export function isConvoActive(convo: ConvoState): convo is ActiveConvoStates {
  return (
    convo.status === ConvoStatus.Ready ||
    convo.status === ConvoStatus.Backgrounded ||
    convo.status === ConvoStatus.Suspended ||
    convo.status === ConvoStatus.Disabled
  )
}
