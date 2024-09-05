import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'
import {device} from '#/storage'

export const ADDITIONAL_LABELER = 'did:plc:oz5zavafp7szpd2yyko57ccz'
export const ADDITIONAL_LABELERS_MAP: {
  [countryCode: string]: string[]
} = {
  US: [ADDITIONAL_LABELER],
}
export const ALL_ADDITIONAL_LABELERS = Object.values(
  ADDITIONAL_LABELERS_MAP,
).flat()
export const NON_CONFIGURABLE_LABELERS = [ADDITIONAL_LABELER]

export function isNonConfigurableModerationAuthority(did: string) {
  return NON_CONFIGURABLE_LABELERS.includes(did)
}

export function configureAdditionalModerationAuthorities() {
  const geolocation = device.get(['geolocation'])
  let additionalLabelers: string[] = ALL_ADDITIONAL_LABELERS

  if (geolocation?.countryCode) {
    additionalLabelers = ADDITIONAL_LABELERS_MAP[geolocation.countryCode] ?? []
  } else {
    logger.info(`no geolocation, cannot apply mod authorities`)
  }

  const appLabelers = Array.from(
    new Set([...BskyAgent.appLabelers, ...additionalLabelers]),
  )

  logger.debug(`applying mod authorities`, {
    additionalLabelers,
    appLabelers,
  })

  BskyAgent.configure({appLabelers})
}
