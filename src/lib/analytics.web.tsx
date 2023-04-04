import React from 'react'
import {createClient, AnalyticsProvider} from '@segment/analytics-react'
import {RootStoreModel} from 'state/models/root-store'

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

export {useAnalytics} from '@segment/analytics-react'

export function init(_store: RootStoreModel) {
  // no init needed on web
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <AnalyticsProvider client={segmentClient}>{children}</AnalyticsProvider>
  )
}
