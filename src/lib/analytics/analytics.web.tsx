import React from 'react'
import {
  createClient,
  AnalyticsProvider,
  useAnalytics as useAnalyticsOrig,
} from '@segment/analytics-react'
import {RootStoreModel} from 'state/models/root-store'
import {useStores} from 'state/models/root-store'
import {sha256} from 'js-sha256'

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
  const store = useStores()
  const methods = useAnalyticsOrig()
  return React.useMemo(() => {
    if (store.session.hasSession) {
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
  }, [store, methods])
}

export function init(store: RootStoreModel) {
  store.onSessionLoaded(() => {
    const sess = store.session.currentSession
    if (sess) {
      if (sess.email) {
        store.log.debug('Ping w/hash')
        const email_hashed = sha256(sess.email)
        segmentClient.identify(email_hashed, {email_hashed})
      } else {
        store.log.debug('Ping w/o hash')
        segmentClient.identify()
      }
    }
  })
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <AnalyticsProvider client={segmentClient}>{children}</AnalyticsProvider>
  )
}
