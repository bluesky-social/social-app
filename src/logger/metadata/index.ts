import {Platform} from 'react-native'

import {BSKY_SERVICE} from '#/lib/constants'
import {setGrowthBookAttributes} from '#/logger/growthbook'
import {getAndMigrateDeviceId, getDeviceId} from '#/logger/metadata/deviceId'
import {getSessionId} from '#/logger/metadata/sessionId'
import * as persisted from '#/state/persisted'
import * as env from '#/env'
import {device} from '#/storage'

export type BaseMetadata = {
  deviceId: string
  sessionId: string
  country: string
}

export type UserMetadata = {
  did: string
  isBskyPds: boolean
  platform: string
  appVersion: string
  bundleIdentifier: string
  bundleDate: number
  refSrc: string
  refUrl: string
  appLanguage: string
  contentLanguages: string[]
}

export type Metadata = BaseMetadata & Partial<UserMetadata>

/**
 * Ensures that deviceId is set and migrated from legacy storage. Handled on
 * startup in `App.<platform>.tsx`
 */
export const setupDeviceId = getAndMigrateDeviceId()

let baseMetadata: BaseMetadata = {
  deviceId: getDeviceId() || 'unknown',
  sessionId: getSessionId(),
  country: device.get(['mergedGeolocation'])?.countryCode || 'unknown',
}
export function updateBaseMetadata(
  metadata: Partial<Omit<BaseMetadata, 'deviceId'>>,
) {
  baseMetadata = {
    ...baseMetadata,
    ...metadata,
    sessionId: metadata.sessionId || getSessionId(),
    deviceId: getDeviceId() || 'unknown',
  }
  __onMetadataChange()
}
export function getBaseMetadata() {
  return {
    ...baseMetadata,
    sessionId: getSessionId(), // may have changed
  }
}

let refSrc = ''
let refUrl = ''
if (env.IS_WEB) {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')
}

let userMetadata: UserMetadata | null = null
export function setUserMetadata(account: persisted.PersistedAccount | null) {
  if (account === null) {
    userMetadata = null
  } else {
    const languagePrefs = persisted.get('languagePrefs')
    userMetadata = {
      did: account.did,
      isBskyPds: account.service.startsWith(BSKY_SERVICE),
      platform: Platform.OS,
      appVersion: env.RELEASE_VERSION,
      bundleIdentifier: env.BUNDLE_IDENTIFIER,
      bundleDate: env.BUNDLE_DATE,
      appLanguage: languagePrefs.appLanguage,
      contentLanguages: languagePrefs.contentLanguages,
      refSrc,
      refUrl,
    }
  }
  __onMetadataChange()
}
export function getUserMetadata() {
  return userMetadata
}

export function getMetadata(): Metadata {
  return {
    ...getBaseMetadata(),
    ...(getUserMetadata() || {}),
  }
}

function __onMetadataChange() {
  const metadata = getMetadata()
  setGrowthBookAttributes(metadata)
}
__onMetadataChange()
