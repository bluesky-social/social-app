import {BskyAgent} from '@atproto/api'

export const ADDITIONAL_LABELER = 'did:plc:oz5zavafp7szpd2yyko57ccz'
export const ADDITIONAL_LABELERS = {
  category: [ADDITIONAL_LABELER],
}

export function configureAdditionalModerationAuthorities() {
  BskyAgent.configure({
    appLabelers: [
      ...BskyAgent.appLabelers,
      ...(ADDITIONAL_LABELERS.category ?? []),
    ],
  })
}
