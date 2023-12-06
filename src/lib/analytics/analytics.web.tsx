import React from 'react'
import {createClient} from '@segment/analytics-react'
import {sha256} from 'js-sha256'
import {TrackEvent, AnalyticsMethods} from './types'

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

export const track: TrackEvent = async (...args) => {
  await segmentClient.track(...args)
}

export function useAnalytics(): AnalyticsMethods {
  const {hasSession} = useSession()
  return React.useMemo(() => {
    if (hasSession) {
      return {
        async screen(...args) {
          await segmentClient.screen(...args)
        },
        async track(...args) {
          await segmentClient.track(...args)
        },
      }
    }
    // dont send analytics pings for anonymous users
    return {
      screen: async () => {},
      track: async () => {},
    }
  }, [hasSession])
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
