import {ToolsOzoneSafelinkDefs} from '@atproto/api'

import {type ServiceConfig} from '../config.js'
import {redirectLogger} from '../logger.js'
import {OzoneAgent} from './ozoneAgent.js'
let cacheCursor: string | undefined

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

  insert(key: string, evt: ToolsOzoneSafelinkDefs.Event) {
    const existing = this.rules.get(key)
    if (!existing || new Date(evt.createdAt) > new Date(existing.createdAt)) {
      this.rules.set(key, evt)
    }
  }

  smartUpdateDomain(event: ToolsOzoneSafelinkDefs.Event) {
    let domain: string
    try {
      domain = new URL(event.url).hostname
    } catch (error) {
      redirectLogger.error(
        `[EventCache:smartUpdateDomain] Invalid URL: ${event.url}, error: ${error}`,
      )
      throw new Error(
        `[EventCache:smartUpdateDomain] Error parsing domain from URL: ${error}`,
      )
    }
    event.url = domain

    try {
      redirectLogger.info(
        `[EventCache] smartUpdateDomain called for domain: ${domain}, action: ${event.action}`,
      )

      if (event.action) {
        this.insert(domain, event)
        redirectLogger.info(
          `[EventCache] rule updated or inserted for: ${domain}`,
        )
        return
      }
    } catch (error) {
      redirectLogger.error(
        `[EventCache:smartUpdateDomain] Error updating rule for domain: ${domain}, error: ${error}`,
      )
      throw new Error(
        `[EventCache:smartUpdateDomain] Error processing domain event: ${error}`,
      )
    }
  }

  smartUpdateUrl(event: ToolsOzoneSafelinkDefs.Event) {
    let url: string
    try {
      url = new URL(event.url).toString()
    } catch (error) {
      redirectLogger.error(
        `[EventCache:smartUpdateUrl] Invalid URL: ${event.url}, error: ${error}`,
      )
      throw new Error(`[EventCache:smartUpdateUrl] Error parsing URL: ${error}`)
    }
    event.url = url

    try {
      redirectLogger.info(
        `[EventCache] smartUpdateUrl called for url: ${url}, action: ${event.action}`,
      )

      if (event.action) {
        this.insert(url, event)
        redirectLogger.info(
          `[EventCache] rule updated or inserted for url: ${url}`,
        )
        return
      }
    } catch (error) {
      redirectLogger.error(
        `[EventCache:smartUpdateUrl] Error updating rule for url: ${url}, error: ${error}`,
      )
      throw new Error(
        `[EventCache:smartUpdateUrl] Error processing url event: ${error}`,
      )
    }
  }

  smartUpdate(event: ToolsOzoneSafelinkDefs.Event) {
    if (event.pattern === ToolsOzoneSafelinkDefs.DOMAIN) {
      redirectLogger.info(
        `[EventCache] smartUpdate called for domain event: ${event.url}, performing ${event.action}`,
      )
      return this.smartUpdateDomain(event)
    }
    if (event.pattern === ToolsOzoneSafelinkDefs.URL) {
      redirectLogger.info(
        `[EventCache] smartUpdate called for url event: ${event.url}`,
      )
      return this.smartUpdateUrl(event)
    }
    throw new Error('[EventCache] Unknown event pattern')
  }

  /**
   * Attempts to retrieve an event for the given URL.
   * Checks in order: domain, domain+path, then full URL.
   */
  smartGet(url: string): ToolsOzoneSafelinkDefs.Event | undefined {
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname
    const domainAndPath = domain + parsedUrl.pathname

    const byDomain = this.rules.get(domain)
    if (byDomain) {
      return byDomain
    }

    const byDomainAndPath = this.rules.get(domainAndPath)
    if (byDomainAndPath) {
      return byDomainAndPath
    }

    return this.rules.get(url)
  }

  delete(event: ToolsOzoneSafelinkDefs.Event) {
    this.rules.delete(event.url)
  }

  get(url: string): ToolsOzoneSafelinkDefs.Event | undefined {
    const event = this.rules.get(url)
    return event
  }

  list(): ToolsOzoneSafelinkDefs.Event[] {
    return Array.from(this.rules.values())
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
