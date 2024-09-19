import React from 'react'
import {createClient} from '@segment/analytics-react'
import * as Sentry from '@sentry/react-native'
import {sha256} from 'js-sha256'

import {logger} from '#/logger'
import {SessionAccount, useSession} from '#/state/session'
import {ScreenPropertiesMap, TrackPropertiesMap} from './types'

type SegmentClient = ReturnType<typeof createClient>

// Delay creating until first actual use.
let segmentClient: SegmentClient | null = null
function getClient(): SegmentClient {
  if (!segmentClient) {
    segmentClient = createClient(
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
  }
  return segmentClient
}

export const track = async <E extends keyof TrackPropertiesMap>(
  event: E,
  properties?: TrackPropertiesMap[E],
) => {
  await getClient().track(event, properties)
}

export function useAnalytics() {
  const {hasSession} = useSession()

  return React.useMemo(() => {
    if (hasSession) {
      return {
        async screen<E extends keyof ScreenPropertiesMap>(
          event: E,
          properties?: ScreenPropertiesMap[E],
        ) {
          await getClient().screen(event, properties)
        },
        async track<E extends keyof TrackPropertiesMap>(
          event: E,
          properties?: TrackPropertiesMap[E],
        ) {
          await getClient().track(event, properties)
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
    const client = getClient()
    if (account.did) {
      const did_hashed = sha256(account.did)
      client.identify(did_hashed, {did_hashed})
      Sentry.setUser({id: did_hashed})
      logger.debug('Ping w/hash')
    } else {
      logger.debug('Ping w/o hash')
      client.identify()
    }
  }
}
