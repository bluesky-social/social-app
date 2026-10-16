import {
  AtpAgent,
  CredentialSession,
  type ToolsOzoneSafelinkDefs,
  type ToolsOzoneSafelinkQueryEvents,
} from '@atproto/api'
import {LRUCache} from 'lru-cache'
import {parse as parseDomain} from 'tldts'

import {type ServiceConfig} from '../config.js'
import type Database from '../db/index.js'
import {type SafelinkRule} from '../db/schema.js'
import {redirectLogger} from '../logger.js'

const SAFELINK_MIN_FETCH_INTERVAL = 1_000
const SAFELINK_MAX_FETCH_INTERVAL = 10_000
const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//

/**
 * The domains whose rules apply to `host`, most specific first: the host
 * itself, then each parent domain up to its registrable domain. Uses the
 * Public Suffix List, including private suffixes like `github.io`, so it never
 * reaches a shared suffix: a rule on `scam.com` covers `pay.scam.com`, but
 * nothing walks up to `co.uk` or `github.io`.
 */
export function domainLookupOrder(host: string): string[] {
  const order = [host]
  let hostname: string
  try {
    hostname = new URL(`https://${host}`).hostname
  } catch {
    return order
  }
  const {domain, isIp} = parseDomain(hostname, {allowPrivateDomains: true})
  if (isIp || !domain || !hostname.endsWith(domain)) {
    return order
  }
  let current = hostname
  while (true) {
    if (!order.includes(current)) order.push(current)
    if (current === domain) break
    current = current.slice(current.indexOf('.') + 1)
  }
  return order
}

export class SafelinkClient {
  private domainCache: LRUCache<string, SafelinkRule | 'ok'>
  private urlCache: LRUCache<string, SafelinkRule | 'ok'>

  private db: Database

  private ozoneAgent: OzoneAgent

  private cursor?: string
  private fetchEventsPromise?: Promise<void>
  private fetchEventsTimeout?: NodeJS.Timeout
  private stopped = false

  constructor({cfg, db}: {cfg: ServiceConfig; db: Database}) {
    this.domainCache = new LRUCache<string, SafelinkRule | 'ok'>({
      max: 10000,
    })

    this.urlCache = new LRUCache<string, SafelinkRule | 'ok'>({
      max: 25000,
    })

    this.db = db

    this.ozoneAgent = new OzoneAgent(
      cfg.safelinkPdsUrl!,
      cfg.safelinkAgentIdentifier!,
      cfg.safelinkAgentPass!,
    )
  }

  public async tryFindRule(link: string): Promise<SafelinkRule | 'ok'> {
    let url: string
    let domain: string
    try {
      url = SafelinkClient.normalizeUrl(link)
      domain = SafelinkClient.normalizeDomain(link)
    } catch (e) {
      redirectLogger.error(
        {error: e, inputUrl: link},
        'failed to normalize looked up link',
      )
      // fail open
      return 'ok'
    }

    const urlRule = await this.lookupRule(this.urlCache, url, 'url')
    if (urlRule !== 'ok') {
      return urlRule
    }

    // domain rules cover subdomains too, and the most specific rule wins
    for (const candidate of domainLookupOrder(domain)) {
      const rule = await this.lookupRule(this.domainCache, candidate, 'domain')
      if (rule !== 'ok') {
        return rule
      }
    }

    return 'ok'
  }

  /**
   * The rule for `key` from the cache, or from the database on a miss. A miss
   * is cached as 'ok' so repeat lookups skip the database.
   */
  private async lookupRule(
    cache: LRUCache<string, SafelinkRule | 'ok'>,
    key: string,
    pattern: ToolsOzoneSafelinkDefs.PatternType,
  ): Promise<SafelinkRule | 'ok'> {
    const cached = cache.get(key)
    if (cached) {
      return cached
    }
    let rule: SafelinkRule | 'ok'
    try {
      rule = await this.getRule(this.db, key, pattern)
    } catch {
      rule = 'ok'
    }
    cache.set(key, rule)
    return rule
  }

  private async getRule(
    db: Database,
    url: string,
    pattern: ToolsOzoneSafelinkDefs.PatternType,
  ): Promise<SafelinkRule> {
    return db.observeQuery(`resolve_safelink_${pattern}_rule`, () =>
      db.db
        .selectFrom('safelink_rule')
        .selectAll()
        .where('url', '=', url)
        .where('pattern', '=', pattern)
        .orderBy('createdAt', 'desc')
        .executeTakeFirstOrThrow(),
    )
  }

  private async addRule(db: Database, rule: SafelinkRule) {
    try {
      if (rule.pattern === 'url') {
        rule.url = SafelinkClient.normalizeUrl(rule.url)
      } else if (rule.pattern === 'domain') {
        rule.url = SafelinkClient.normalizeDomain(rule.url)
      }
    } catch (e) {
      redirectLogger.error(
        {error: e, inputUrl: rule.url},
        'failed to normalize rule input URL',
      )
      return
    }

    await db.db
      .insertInto('safelink_rule')
      .values({
        id: rule.id,
        eventType: rule.eventType,
        url: rule.url,
        pattern: rule.pattern,
        action: rule.action,
        createdAt: rule.createdAt,
      })
      .onConflict(oc => oc.column('id').doNothing())
      .execute()
      .catch(err => {
        redirectLogger.error(
          {error: err, rule},
          'failed to add rule to database',
        )
        throw err
      })

    if (rule.pattern === 'domain') {
      this.domainCache.delete(rule.url)
    } else {
      this.urlCache.delete(rule.url)
    }
  }

  private async removeRule(db: Database, rule: SafelinkRule) {
    try {
      if (rule.pattern === 'url') {
        rule.url = SafelinkClient.normalizeUrl(rule.url)
      } else if (rule.pattern === 'domain') {
        rule.url = SafelinkClient.normalizeDomain(rule.url)
      }
    } catch (e) {
      redirectLogger.error(
        {error: e, inputUrl: rule.url},
        'failed to normalize rule input URL',
      )
      return
    }

    await db.db
      .deleteFrom('safelink_rule')
      .where('pattern', '=', rule.pattern)
      .where('url', '=', rule.url)
      .execute()
      .catch(err => {
        redirectLogger.error(
          {error: err, rule},
          'failed to remove rule from database',
        )
        throw err
      })

    if (rule.pattern === 'domain') {
      this.domainCache.delete(rule.url)
    } else {
      this.urlCache.delete(rule.url)
    }
  }

  public runFetchEvents(): Promise<void> {
    if (this.stopped) {
      return Promise.resolve()
    }

    this.fetchEventsPromise ??= this.fetchEvents().finally(() => {
      this.fetchEventsPromise = undefined
    })
    return this.fetchEventsPromise
  }

  public async stop(timeoutMs: number): Promise<void> {
    this.stopped = true
    if (this.fetchEventsTimeout) {
      clearTimeout(this.fetchEventsTimeout)
      this.fetchEventsTimeout = undefined
    }
    const activePoll = this.fetchEventsPromise
    if (!activePoll) {
      return
    }

    let timeout: NodeJS.Timeout | undefined
    const stopWaiting = new Promise<void>(resolve => {
      timeout = setTimeout(() => {
        redirectLogger.warn(
          {timeoutMs},
          'Safelink poll exceeded its shutdown deadline',
        )
        resolve()
      }, timeoutMs)
    })
    try {
      await Promise.race([activePoll, stopWaiting])
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }

  private scheduleFetchEvents(delay: number) {
    if (this.stopped) {
      return
    }
    this.fetchEventsTimeout = setTimeout(() => {
      this.fetchEventsTimeout = undefined
      void this.runFetchEvents()
    }, delay)
  }

  private async fetchEvents() {
    let agent: AtpAgent
    try {
      agent = await this.ozoneAgent.getAgent()
    } catch (err) {
      if (this.stopped) {
        return
      }
      redirectLogger.error({error: err}, 'error getting Ozone agent')
      this.scheduleFetchEvents(SAFELINK_MAX_FETCH_INTERVAL)
      return
    }

    if (this.stopped) {
      return
    }

    let res: ToolsOzoneSafelinkQueryEvents.Response
    try {
      const cursor = await this.getCursor()
      res = await agent.tools.ozone.safelink.queryEvents({
        cursor,
        limit: 100,
        sortDirection: 'asc',
      })
    } catch (err) {
      if (this.stopped) {
        return
      }
      redirectLogger.error(
        {error: err},
        'error fetching safelink events from Ozone',
      )
      this.scheduleFetchEvents(SAFELINK_MAX_FETCH_INTERVAL)
      return
    }

    if (this.stopped) {
      return
    }

    if (res.data.events.length === 0) {
      redirectLogger.info('received no new safelink events from ozone')
      this.scheduleFetchEvents(SAFELINK_MAX_FETCH_INTERVAL)
    } else {
      try {
        await this.db.transaction(async db => {
          for (const rule of res.data.events) {
            switch (rule.eventType) {
              case 'removeRule':
                await this.removeRule(db, rule)
                break
              case 'addRule':
              case 'updateRule':
                await this.addRule(db, rule)
                break
              default:
                redirectLogger.warn({rule}, 'received unknown rule event type')
            }
          }
        })
        if (this.stopped) {
          return
        }
        if (res.data.cursor) {
          redirectLogger.info(
            {cursor: res.data.cursor},
            'received new safelink events from Ozone',
          )
          await this.setCursor(res.data.cursor)
        }
      } catch (err) {
        if (this.stopped) {
          return
        }
        redirectLogger.error(
          {error: err},
          'error applying safelink events from Ozone',
        )
        this.scheduleFetchEvents(SAFELINK_MAX_FETCH_INTERVAL)
        return
      }
      this.scheduleFetchEvents(SAFELINK_MIN_FETCH_INTERVAL)
    }
  }

  private async getCursor() {
    if (this.cursor === undefined) {
      const res = await this.db.db
        .selectFrom('safelink_cursor')
        .selectAll()
        .where('id', '=', 1)
        .executeTakeFirst()
      if (!res) {
        return ''
      }
      this.cursor = res.cursor
    }
    return this.cursor
  }

  private async setCursor(cursor: string) {
    const updatedAt = new Date()
    try {
      await this.db.db
        .insertInto('safelink_cursor')
        .values({
          id: 1,
          cursor,
          updatedAt,
        })
        .onConflict(oc => oc.column('id').doUpdateSet({cursor, updatedAt}))
        .execute()
      this.cursor = cursor
    } catch (err) {
      redirectLogger.error({error: err}, 'failed to update safelink cursor')
    }
  }

  private static normalizeUrl(input: string) {
    if (!SCHEME_REGEX.test(input)) {
      input = `https://${input}`
    }
    const u = new URL(input)
    u.hash = ''
    let normalized = u.href.replace(SCHEME_REGEX, '').toLowerCase()
    if (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1)
    }
    return normalized
  }

  private static normalizeDomain(input: string) {
    if (!SCHEME_REGEX.test(input)) {
      input = `https://${input}`
    }
    const u = new URL(input)
    return u.host.toLowerCase()
  }
}

export class OzoneAgent {
  private identifier: string
  private password: string

  private session: CredentialSession
  private agent: AtpAgent

  constructor(pdsHost: string, identifier: string, password: string) {
    this.identifier = identifier
    this.password = password

    this.session = new CredentialSession(new URL(pdsHost))
    this.agent = new AtpAgent(this.session)
  }

  public async getAgent() {
    if (!this.identifier && !this.password) {
      throw new Error(
        'OZONE_AGENT_HANDLE and OZONE_AGENT_PASS environment variables must be set',
      )
    }

    if (!this.session.hasSession) {
      redirectLogger.info('creating Ozone session')
      await this.session.login({
        identifier: this.identifier,
        password: this.password,
      })
      redirectLogger.info('ozone session created successfully')
    }

    return this.agent
  }
}
