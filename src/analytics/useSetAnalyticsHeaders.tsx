import {useAgent} from '#/state/session'
import {getDeviceId, useSessionId} from '#/analytics/identifiers'
import {getIPGeolocationString} from '#/geolocation/util'

/**
 * Get anonymous identifiers and construct headers we use for requests that may
 * trigger experiment exposures in our backend. These values are used for A/B
 * test bucketing, in addition to the user DID, if the request is
 * authenticated. They ensure we can consistently deliver beta features to
 * users.
 *
 * This should be mounted as high as possible in the tree, _after_
 * `setupDeviceId` has resolved and session context is available.
 *
 * The setters here are not wrapped in an effect because this hook does not
 * render that often, and we want to make sure the headers are set as soon as
 * possible after `agent` changes to ensure analytics events are properly
 * attributed.
 *
 * The values here are not specific to an account. If we add new values here in
 * the future, we should ensure that they are not account specific and handle
 * those separately (and more carefully).
 *
 * These headers must stay in sync with our appview.
 * @see https://github.com/bluesky-social/atproto/blob/39cf199df5847d3fd4a60d8cdeb604a0e07f9784/packages/bsky/src/feature-gates/utils.ts#L7-L8
 */
export function useSetAnalyticsHeaders() {
  const agent = useAgent()
  const sessionId = useSessionId()
  agent.setHeader('X-Bsky-Device-Id', getDeviceId() ?? '')
  agent.setHeader('X-Bsky-Session-Id', sessionId)
  const geo = getIPGeolocationString()
  if (geo) {
    agent.setHeader('X-Bsky-IP-Geolocation', geo)
  }
}
