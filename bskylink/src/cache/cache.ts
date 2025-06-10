import {ToolsOzoneSafelinkDefs} from '@atproto/api'

import {type ServiceConfig} from '../config.js'
import {redirectLogger} from '../logger.js'
// import {ozoneAgent} from './agent.js'
import {OzoneAgent} from './ozoneAgent.js'
let cacheCursor: string | undefined

export class EventCache {
  private rules = new Map<string, ToolsOzoneSafelinkDefs.Event>()
  private cfg: ServiceConfig | undefined = undefined

  constructor() {
    this.cfg = undefined
  }
  async init(cfg: ServiceConfig) {
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
    try {
      const domain = new URL(event.url).hostname
      event.url = domain

      redirectLogger.info(
        `[EventCache] smartUpdateDomain called for domain: ${domain}, action: ${event.action}`,
      )

      if (event.action === ToolsOzoneSafelinkDefs.REMOVERULE) {
        // If the action is to remove the rule, delete it from the cache
        this.insert(domain, event)
        redirectLogger.info(
          `[EventCache] Removed rule for domain, adjusted audit log: ${domain}`,
        )
        return
      }
      // if update should happen
      if (event.action === ToolsOzoneSafelinkDefs.WHITELIST) {
        this.insert(domain, event)
        redirectLogger.info(`[EventCache] Whitelisted domain: ${domain}`)
        return
      }
      if (event.action === ToolsOzoneSafelinkDefs.BLOCK) {
        this.insert(domain, event)
        redirectLogger.info(`[EventCache] Blocked domain: ${domain}`)
        return
      }
      if (event.action === ToolsOzoneSafelinkDefs.WARN) {
        this.insert(domain, event)
        redirectLogger.info(`[EventCache] Warned domain: ${domain}`)
        return
      }
    } catch (error) {
      redirectLogger.error(
        `[EventCache:smartUpdateDomain] Error in smartUpdateDomain: ${error}`,
      )
      throw new Error(
        `[EventCache:smartUpdateDomain] Error processing domain event: ${error}`,
      )
    }
  }

  smartUpdateUrl(event: ToolsOzoneSafelinkDefs.Event) {
    redirectLogger.info(
      `[EventCache] smartUpdateUrl called for url: ${event.url}, action: ${event.action}`,
    )
    if (event.action === ToolsOzoneSafelinkDefs.REMOVERULE) {
      // If the action is to remove the rule, delete it from the cache
      this.insert(event.url, event)
      redirectLogger.info(`[EventCache] Removed rule for url: ${event.url}`)
      return
    }
    // if update should happen
    if (event.action === ToolsOzoneSafelinkDefs.WHITELIST) {
      this.insert(event.url, event)
      redirectLogger.info(`[EventCache] Whitelisted url: ${event.url}`)
      return
    }
    if (event.action === ToolsOzoneSafelinkDefs.BLOCK) {
      this.insert(event.url, event)
      redirectLogger.info(`[EventCache] Blocked url: ${event.url}`)
      return
    }
    if (event.action === ToolsOzoneSafelinkDefs.WARN) {
      this.insert(event.url, event)
      redirectLogger.info(`[EventCache] Warned url: ${event.url}`)
      return
    }
  }

  // Insert or update an event
  smartUpdate(event: ToolsOzoneSafelinkDefs.Event) {
    if (event.pattern === ToolsOzoneSafelinkDefs.DOMAIN) {
      redirectLogger.info(
        `[EventCache] smartUpdate called for domain event: ${event.url}, performing$ ${event.action}`,
      )
      return this.smartUpdateDomain(event)
    }
    if (event.pattern === ToolsOzoneSafelinkDefs.URL) {
      redirectLogger.info(
        `[EventCache] smartUpdate called for domain event: ${event.url}`,
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

    // 1. Check for a rule by domain only
    const byDomain = this.rules.get(domain)
    if (byDomain) {
      return byDomain
    }

    // 2. Check for a rule by domain + path
    const byDomainAndPath = this.rules.get(domainAndPath)
    if (byDomainAndPath) {
      return byDomainAndPath
    }

    // 3. Check for a rule by full URL
    return this.rules.get(url)
  }

  delete(event: ToolsOzoneSafelinkDefs.Event) {
    this.rules.delete(event.url)
  }

  // Get an event by full URL
  get(url: string): ToolsOzoneSafelinkDefs.Event | undefined {
    const event = this.rules.get(url)
    return event
  }

  // List all events
  list(): ToolsOzoneSafelinkDefs.Event[] {
    return Array.from(this.rules.values())
  }
}

// Adaptive polling: slow down if no new events, speed up if updates found
let pollInterval = 1 * 1000 // start at 1 seconds

export async function adaptiveFetchAndUpdate() {
  const prevCursor = cacheCursor
  const eventConfig = await eventCache.getConfig()
  if (eventConfig === undefined) {
    redirectLogger.info(
      `[adaptiveFetchAndUpdate] No Configuration found, skipping fetch.`,
    )
  } else {
    await fetchAndUpdateEvents(eventConfig)
  }
  // If no new events, increase interval (up to 10 minutes), else reset to 5s
  if (cacheCursor === prevCursor) {
    pollInterval = Math.min(pollInterval * 2, 10 * 60 * 1000)
    redirectLogger.info(
      `[adaptiveFetchAndUpdate] No new events, backing off. Next poll in ${
        pollInterval / 1000
      }s`,
    )
  } else {
    pollInterval = 5 * 1000
    redirectLogger.info(
      `[adaptiveFetchAndUpdate] New events found, resetting poll interval to ${
        pollInterval / 1000
      }s`,
    )
  }
  setTimeout(adaptiveFetchAndUpdate, pollInterval)
}

// Export a singleton instance
export const eventCache = new EventCache()
// Start adaptive polling
// adaptiveFetchAndUpdate()

// Function to fetch and update events from the server
export async function fetchAndUpdateEvents(cfg: ServiceConfig) {
  if (!cfg || !cfg.ozoneUrl || !cfg.ozoneAgentHandle || !cfg.ozoneAgentPass) {
    console.error(
      '[eventCache:fetchAndUpdateEvents] No active config, skipping actions',
    )
    return
  }
  redirectLogger.info(
    `[eventCache] Fetching events with cursor: ${cacheCursor}`,
  )
  // Use current session DID instead of env variable
  const ozoneAgent = await new OzoneAgent(cfg)
  const ozoneSession = await ozoneAgent.getSession?.()
  if (!ozoneSession) {
    console.error('[eventCache:fetchAndUpdateEvents] No active session found.')
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
    limit: 100, // Adjust as needed
  })

  if (res?.data.cursor === cacheCursor) {
    redirectLogger.info(
      '[eventCache:fetchAndUpdateEvents] No new events to update.',
    )
    return
  }

  redirectLogger.info(`[eventCache:fetchAndUpdateEvents] Received response:`, {
    ...res,
    data: {
      ...res?.data,
      rules: Array.isArray(res?.data?.events)
        ? res.data.events.map(event => JSON.stringify(event))
        : res?.data?.events,
    },
  })

  for (const event of res.data.events) {
    eventCache.smartUpdate(event)
  }

  cacheCursor = res.data?.cursor

  redirectLogger.info(
    '[eventCache:fetchAndUpdateEvents] Current cache contents:',
  )
  redirectLogger.info(eventCache.list())
}
