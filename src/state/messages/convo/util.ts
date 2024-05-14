import {ConvoState, ConvoStatus} from './types'

export function isConvoReady(convo: ConvoState) {
  return (
    convo.status === ConvoStatus.Ready ||
    convo.status === ConvoStatus.Backgrounded ||
    convo.status === ConvoStatus.Suspended
  )
}
