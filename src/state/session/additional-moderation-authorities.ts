import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'
import {device} from '#/storage'

export const BR_LABELER = 'did:plc:ekitcvx7uwnauoqy5oest3hm' // Brazil
export const DE_LABELER = 'did:plc:r55ow3tocux5kafs5dq445fy' // Germany
export const RU_LABELER = 'did:plc:crm2agcxvvlj6hilnjdc4hox' // Russia
export const GB_LABELER = 'did:plc:gvkp7euswjjrctjmqwhhfzif' // United Kingdom
export const AU_LABELER = 'did:plc:dsynw7isrf2eqlhcjx3ffnmt' // Australia
export const TR_LABELER = 'did:plc:cquoj7aozvmkud2gifeinkda' // Turkey
export const JP_LABELER = 'did:plc:vhgppeyjwgrr37vm4v6ggd5a' // Japan
export const ES_LABELER = 'did:plc:zlbbuj5nov4ixhvgl3bj47em' // Spain
export const PK_LABELER = 'did:plc:zrp6a3tvprrsgawsbswbxu7m' // Pakistan
export const IN_LABELER = 'did:plc:srr4rdvgzkbx6t7fxqtt6j5t' // India

/**
 * For all EU countries
 */
export const EU_LABELER = 'did:plc:z57lz5dhgz2dkjogoysm3vut'

const MODERATION_AUTHORITIES: {
  [countryCode: string]: string[]
} = {
  BR: [BR_LABELER], // Brazil
  RU: [RU_LABELER], // Russia
  GB: [GB_LABELER], // United Kingdom
  AU: [AU_LABELER], // Australia
  TR: [TR_LABELER], // Turkey
  JP: [JP_LABELER], // Japan
  PK: [PK_LABELER], // Pakistan
  IN: [IN_LABELER], // India

  // EU countries
  AT: [EU_LABELER], // Austria
  BE: [EU_LABELER], // Belgium
  BG: [EU_LABELER], // Bulgaria
  HR: [EU_LABELER], // Croatia
  CY: [EU_LABELER], // Cyprus
  CZ: [EU_LABELER], // Czech Republic
  DK: [EU_LABELER], // Denmark
  EE: [EU_LABELER], // Estonia
  FI: [EU_LABELER], // Finland
  FR: [EU_LABELER], // France
  DE: [EU_LABELER, DE_LABELER], // Germany
  GR: [EU_LABELER], // Greece
  HU: [EU_LABELER], // Hungary
  IE: [EU_LABELER], // Ireland
  IT: [EU_LABELER], // Italy
  LV: [EU_LABELER], // Latvia
  LT: [EU_LABELER], // Lithuania
  LU: [EU_LABELER], // Luxembourg
  MT: [EU_LABELER], // Malta
  NL: [EU_LABELER], // Netherlands
  PL: [EU_LABELER], // Poland
  PT: [EU_LABELER], // Portugal
  RO: [EU_LABELER], // Romania
  SK: [EU_LABELER], // Slovakia
  SI: [EU_LABELER], // Slovenia
  ES: [EU_LABELER, ES_LABELER], // Spain
  SE: [EU_LABELER], // Sweden
}

const MODERATION_AUTHORITIES_DIDS = Array.from(
  new Set(Object.values(MODERATION_AUTHORITIES).flat()),
)

export function isNonConfigurableModerationAuthority(did: string) {
  return MODERATION_AUTHORITIES_DIDS.includes(did)
}

export function configureAdditionalModerationAuthorities() {
  const geolocation = device.get(['geolocation'])
  // default to all
  let additionalLabelers: string[] = MODERATION_AUTHORITIES_DIDS

  if (geolocation?.countryCode) {
    // overwrite with only those necessary
    additionalLabelers = MODERATION_AUTHORITIES[geolocation.countryCode] ?? []
  } else {
    logger.info(`no geolocation, cannot apply mod authorities`)
  }

  if (__DEV__) {
    additionalLabelers = []
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
