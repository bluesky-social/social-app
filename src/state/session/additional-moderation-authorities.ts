import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'
import {device} from '#/storage'

export const BR_LABELER = 'did:plc:ekitcvx7uwnauoqy5oest3hm'
export const DE_LABELER = 'did:plc:r55ow3tocux5kafs5dq445fy'
export const ADDITIONAL_LABELERS_MAP: {
  [countryCode: string]: string[]
} = {
  BR: [BR_LABELER],
  DE: [DE_LABELER],
}
export const ALL_ADDITIONAL_LABELERS = Object.values(
  ADDITIONAL_LABELERS_MAP,
).flat()
export const NON_CONFIGURABLE_LABELERS = [BR_LABELER, DE_LABELER]

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

  logger.info(`applying mod authorities`, {
    additionalLabelers,
    appLabelers,
  })

  BskyAgent.configure({appLabelers})
}
