import React from 'react'
import {
  createClient,
  AnalyticsProvider,
  useAnalytics as useAnalyticsOrig,
} from '@segment/analytics-react'
import {sha256} from 'js-sha256'

import {useSession, SessionAccount} from '#/state/session'
import {logger} from '#/logger'

const segmentClient = createClient(
  {
    writeKey: '8I6DsgfiSLuoONyaunGoiQM7A6y2ybdI',
  },
  {
    integrations: {
      'Segment.io': {
        apiHost: 'api.events.bsky.app/v1',
      },
    },
  },
)
export const track = segmentClient?.track?.bind?.(segmentClient)

export function useAnalytics() {
  const {hasSession} = useSession()
  const methods = useAnalyticsOrig()
  return React.useMemo(() => {
    if (hasSession) {
      return methods
    }
    // dont send analytics pings for anonymous users
    return {
      screen: () => {},
      track: () => {},
      identify: () => {},
      flush: () => {},
      group: () => {},
      alias: () => {},
      reset: () => {},
    }
  }, [hasSession, methods])
}

export function init(account: SessionAccount | undefined) {
  if (account) {
    if (account.did) {
      if (account.did) {
        const did_hashed = sha256(account.did)
        segmentClient.identify(did_hashed, {did_hashed})
        logger.debug('Ping w/hash')
      } else {
        logger.debug('Ping w/o hash')
        segmentClient.identify()
      }
    }
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <AnalyticsProvider client={segmentClient}>{children}</AnalyticsProvider>
  )
}
