import {type ComAtprotoLabelDefs} from '@atproto/api'

export function isBotAccount(
  profile: {did: string; labels?: ComAtprotoLabelDefs.Label[]},
): boolean {
  return (
    profile.labels?.some(l => l.val === 'bot' && l.src === profile.did) ?? false
  )
}
