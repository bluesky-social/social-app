import React from 'react'
import {
  createClient,
  AnalyticsProvider,
  useAnalytics as useAnalyticsOrig,
} from '@segment/analytics-react'
import {RootStoreModel} from 'state/models/root-store'
import {useStores} from 'state/models/root-store'

const segmentClient = createClient(
  {
    writeKey: '8I6DsgfiSLuoONyaunGoiQM7A6y2ybdI',
  },
  {
    integrations: {
      'Segment.io': {
        apiHost: 'api.evt.bsky.app/v1',
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
      console.log('real')
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

export function init(_store: RootStoreModel) {
  // no init needed on web
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <AnalyticsProvider client={segmentClient}>{children}</AnalyticsProvider>
  )
}
