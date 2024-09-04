import {BskyAgent} from '@atproto/api'

export const ADDITIONAL_LABELER = 'did:plc:oz5zavafp7szpd2yyko57ccz'
export const ADDITIONAL_LABELERS_MAP = {
  category: [ADDITIONAL_LABELER],
}
export const NON_CONFIGURABLE_LABELERS = [ADDITIONAL_LABELER]

export function isNonConfigurableModerationAuthority(did: string) {
  return NON_CONFIGURABLE_LABELERS.includes(did)
}

export function configureAdditionalModerationAuthorities() {
  BskyAgent.configure({
    appLabelers: [
      ...BskyAgent.appLabelers,
      ...(ADDITIONAL_LABELERS_MAP.category ?? []),
    ],
  })
}
