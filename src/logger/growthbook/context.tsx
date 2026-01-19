import {useMemo, useEffect} from 'react'
import {Platform} from 'react-native'
import {
  GrowthBook,
  GrowthBookProvider,
  useFeatureIsOn,
} from '@growthbook/growthbook-react'

import * as env from '#/env'
import {useSession, SessionAccount} from '#/state/session'
import {useGeolocation} from '#/geolocation'
import * as persisted from '#/state/persisted'
import * as referrer from '#/logger/growthbook/util/referrer'

type DefaultAttributes = {
  country: string
}
type UserAttributes = {
  id: string
  pds: string | undefined
  platform: string
  appVersion: string
  bundleIdentifier: string
  bundleDate: number
  refSrc: string
  refUrl: string
  appLanguage: string
  contentLanguages: string[]
}

const gb = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  trackingCallback: (experiment, result) => {
    // TODO
    console.log('Experiment Viewed', {
      experimentId: experiment.key,
      variationId: result.key,
    })
  },
})

export const initializer = gb.init({
  timeout: 1e3,
})

export function useGate(gate: string): boolean {
  return useFeatureIsOn(gate)
}

export function Provider({children}: {children: React.ReactNode}) {
  const geo = useGeolocation()
  const {currentAccount} = useSession()
  const defaultAttributes = useMemo<DefaultAttributes>(
    () => ({
      country: geo.countryCode || 'unknown',
    }),
    [geo],
  )

  /**
   * Decorate existing attributes with any new default attributes
   */
  useEffect(() => {
    const attr = {
      ...gb.getAttributes(),
      ...defaultAttributes,
    }
    gb.setAttributes(attr)
    console.debug(`update attributes`, {attributes: attr})
  }, [defaultAttributes])

  /**
   * Update user attributes on session change, and clear them on logout
   */
  useEffect(() => {
    if (currentAccount) {
      const attr = getUserAttributes(currentAccount)
      gb.setAttributes({
        ...defaultAttributes,
        ...getUserAttributes(currentAccount),
      })
      console.debug(`has session, set attributes`, {attributes: attr})
    } else {
      gb.setAttributes(defaultAttributes)
      console.debug(`no session, reset attributes`, {
        attributes: defaultAttributes,
      })
    }
  }, [defaultAttributes, currentAccount])

  return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>
}

export function getUserAttributes(account: SessionAccount): UserAttributes
export function getUserAttributes(account: undefined): null
export function getUserAttributes(
  account?: SessionAccount,
): UserAttributes | null {
  if (!account) return null
  const languagePrefs = persisted.get('languagePrefs')
  return {
    id: account.did,
    pds: account.pdsUrl,
    platform: Platform.OS,
    appVersion: env.RELEASE_VERSION,
    bundleIdentifier: env.BUNDLE_IDENTIFIER,
    bundleDate: env.BUNDLE_DATE,
    appLanguage: languagePrefs.appLanguage,
    contentLanguages: languagePrefs.contentLanguages,
    refSrc: referrer.src,
    refUrl: referrer.url,
  }
}
