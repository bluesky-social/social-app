import {ToolsOzoneSafelinkDefs} from '@atproto/api'

import {type ServiceConfig} from '../config.js'
import {redirectLogger} from '../logger.js'
import {OzoneAgent} from './safelinkClient.js'

export class EventCache {
  private rules = new Map<string, ToolsOzoneSafelinkDefs.Event>()
  private cfg: ServiceConfig
  private pollInterval = 1 * 1000 // start at 1 second

  constructor(cfg: ServiceConfig) {
    this.cfg = cfg
  }

  async getConfig(): Promise<ServiceConfig | undefined> {
    return this.cfg
  }

  // Adaptive polling: slow down if no new events, speed up if updates found
  async adaptiveFetchAndUpdate() {
    const prevCursor = cacheCursor
    const eventConfig = await this.getConfig()
    if (eventConfig === undefined) {
      redirectLogger.info(
        `[adaptiveFetchAndUpdate] No Configuration found, skipping fetch.`,
      )
    } else {
      await this.fetchAndUpdateEvents(eventConfig)
    }
    if (cacheCursor === prevCursor) {
      this.pollInterval = Math.min(this.pollInterval * 2, 10 * 60 * 1000)
      redirectLogger.info(
        `[adaptiveFetchAndUpdate] No new events, backing off. Next poll in ${
          this.pollInterval / 1000
        }s`,
      )
    } else {
      this.pollInterval = 5 * 1000
      redirectLogger.info(
        `[adaptiveFetchAndUpdate] New events found, resetting poll interval to ${
          this.pollInterval / 1000
        }s`,
      )
    }
    setTimeout(() => this.adaptiveFetchAndUpdate(), this.pollInterval)
  }

  // Fetch and update events from the server
  async fetchAndUpdateEvents(cfg: ServiceConfig) {
    if (!cfg || !cfg.ozoneUrl || !cfg.ozoneAgentHandle || !cfg.ozoneAgentPass) {
      console.error(
        '[eventCache:fetchAndUpdateEvents] No active config, skipping actions',
      )
      return
    }
    redirectLogger.info(
      `[eventCache] Fetching events with cursor: ${cacheCursor}`,
    )
    const ozoneAgent = new OzoneAgent(cfg)
    const ozoneSession = await ozoneAgent.getSession?.()
    if (!ozoneSession) {
      console.error(
        '[eventCache:fetchAndUpdateEvents] No active session found.',
      )
      return
    }
    const ozoneDid = ozoneSession.did
    if (!ozoneDid || ozoneDid === 'did:plc:invalid') {
      console.error(
        '[eventCache:fetchAndUpdateEvents] Invalid or missing session DID.',
      )
      return
    }
    ozoneAgent.agent.setHeader?.('atproto-proxy', `${ozoneDid}#atproto_labeler`)

    const res = await ozoneAgent.agent.tools?.ozone?.safelink?.queryEvents?.({
      cursor: cacheCursor,
      limit: 100,
    })

    if (res?.data.cursor === cacheCursor) {
      redirectLogger.info(
        '[eventCache:fetchAndUpdateEvents] No new events to update.',
      )
      return
    }

    redirectLogger.info(
      `[eventCache:fetchAndUpdateEvents] Received response:`,
      {
        ...res,
        data: {
          ...res?.data,
          rules: Array.isArray(res?.data?.events)
            ? res.data.events.map(event => JSON.stringify(event))
            : res?.data?.events,
        },
      },
    )

    for (const event of res.data.events) {
      this.smartUpdate(event)
    }

    cacheCursor = res.data?.cursor

    redirectLogger.info(
      '[eventCache:fetchAndUpdateEvents] Current cache contents:',
    )
    redirectLogger.info(this.list())
  }
}
