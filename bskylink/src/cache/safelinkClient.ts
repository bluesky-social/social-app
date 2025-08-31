import {
  AtpAgent,
  CredentialSession,
  type ToolsOzoneSafelinkQueryEvents,
} from '@atproto/api'
import {LRUCache} from 'lru-cache'

import {type ServiceConfig} from '../config.js'
import type Database from '../db/index.js'
import {type RulePatternType, type SafelinkRule} from '../db/schema.js'
import {redirectLogger} from '../logger.js'

const SAFELINK_MIN_FETCH_INTERVAL = 1_000
const SAFELINK_MAX_FETCH_INTERVAL = 10_000

export class SafelinkClient {
  private domainCache: LRUCache<string, SafelinkRule | 'ok'>
  private urlCache: LRUCache<string, SafelinkRule | 'ok'>

  private db: Database

  private ozoneAgent: OzoneAgent

  private cursor?: string

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

      return 'ok'
    }

    redirectLogger.info(url)
    redirectLogger.info(domain)

    const urlRule = this.urlCache.get(url)
    if (urlRule) {
      return urlRule
    }

    const domainRule = this.domainCache.get(domain)
    if (domainRule) {
      return domainRule
    }

    try {
      const maybeUrlRule = await this.getRule(this.db, url, 'url')
      this.urlCache.set(url, maybeUrlRule)
      return maybeUrlRule
    } catch (e) {
      this.urlCache.set(url, 'ok')
    }

    try {
      const maybeDomainRule = await this.getRule(this.db, domain, 'domain')
      this.domainCache.set(domain, maybeDomainRule)
      return maybeDomainRule
    } catch (e) {
      this.domainCache.set(domain, 'ok')
    }

    return 'ok'
  }

  private async getRule(
    db: Database,
    url: string,
    pattern: RulePatternType,
  ): Promise<SafelinkRule> {
    // @ts-ignore
    return db.db
      .selectFrom('safelink_rule')
      .where('url', '=', url)
      .where('pattern', '=', pattern)
      .executeTakeFirstOrThrow()
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

    db.db
      .insertInto('safelink_rule')
      .values(rule)
      .execute()
      .catch(err => {
        redirectLogger.error(
          {error: err, rule},
          'failed to add rule to database',
        )
      })

    if (rule.pattern === 'domain') {
      this.domainCache.set(rule.url, rule)
    } else {
      this.urlCache.set(rule.url, rule)
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
      .where('pattern', '=', 'domain')
      .where('url', '=', rule.url)
      .execute()
      .catch(err => {
        redirectLogger.error(
          {error: err, rule},
          'failed to remove rule from database',
        )
      })

    if (rule.pattern === 'domain') {
      this.domainCache.delete(rule.url)
    } else {
      this.urlCache.delete(rule.url)
    }
  }

  public async runFetchEvents() {
    let agent: AtpAgent
    try {
      agent = await this.ozoneAgent.getAgent()
    } catch (err) {
      redirectLogger.error({error: err}, 'error getting Ozone agent')
      setTimeout(() => this.runFetchEvents(), SAFELINK_MAX_FETCH_INTERVAL)
      return
    }

    let res: ToolsOzoneSafelinkQueryEvents.Response
    try {
      const cursor = await this.getCursor()
      res = await agent.tools.ozone.safelink.queryEvents({
        cursor,
        limit: 100,
      })
    } catch (err) {
      redirectLogger.error(
        {error: err},
        'error fetching safelink events from Ozone',
      )
      setTimeout(() => this.runFetchEvents(), SAFELINK_MAX_FETCH_INTERVAL)
      return
    }

    if (res.data.cursor === this.cursor || res.data.events.length === 0) {
      redirectLogger.info(
        {cursor: res.data.cursor},
        'received same cursor from Ozone',
      )
      setTimeout(() => this.runFetchEvents(), SAFELINK_MAX_FETCH_INTERVAL)
    } else {
      await this.db.transaction(async db => {
        for (const rule of res.data.events) {
          if (rule.eventType === 'removeRule') {
            await this.removeRule(db, rule)
          } else {
            await this.addRule(db, rule)
          }
        }
      })
      if (res.data.cursor) {
        redirectLogger.info(
          {cursor: res.data.cursor},
          'received new cursor from Ozone',
        )
        await this.setCursor(res.data.cursor)
      }
      setTimeout(() => this.runFetchEvents(), SAFELINK_MIN_FETCH_INTERVAL)
    }
  }

  private async getCursor() {
    if (this.cursor === '') {
      // TODO: catch err
      const res = await this.db.db
        .selectFrom('safelink_cursor')
        .orderBy('createdAt desc')
        .limit(1)
        .executeTakeFirst()

      if (!res) {
        return ''
      }

      // @ts-ignore TODO: fix this
      this.cursor = res.cursor
    }
    return this.cursor
  }

  private async setCursor(cursor: string) {
    try {
      await this.db.db
        .insertInto('safelink_cursor')
        .values({
          cursor,
          createdAt: new Date(),
        })
        .execute()
      this.cursor = cursor
    } catch (err) {
      redirectLogger.error({error: err}, 'failed to update safelink cursor')
    }
  }

  private static normalizeUrl(input: string) {
    if (!input.startsWith('https://')) {
      input = `https://${input}`
    }
    const u = new URL(input)
    u.hash = ''
    let normalized = u.href.replace(/^[^:]+:\/\//, '').toLowerCase()
    if (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1)
    }
    return normalized
  }

  private static normalizeDomain(input: string) {
    if (!input.startsWith('https://')) {
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

  public async getSession(): Promise<CredentialSession> {
    if (!this.session.hasSession) {
      await this.getAgent()
    }
    return this.session
  }

  public async getAgent(): Promise<AtpAgent> {
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
