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
    const u = new URL(link)
    u.search = ''
    u.hash = ''

    const d = new URL(u.href)
    d.pathname = ''

    const urlRule = this.urlCache.get(u.href)
    if (urlRule) {
      return urlRule
    }

    const domainRule = this.domainCache.get(d.href)
    if (domainRule) {
      return domainRule
    }

    try {
      const maybeUrlRule = await this.getRule(this.db, u.href, 'url')
      this.urlCache.set(u.href, maybeUrlRule)
      return maybeUrlRule
    } catch (e) {
      this.urlCache.set(u.href, 'ok')
    }

    try {
      const maybeDomainRule = await this.getRule(this.db, u.href, 'domain')
      this.domainCache.set(d.href, maybeDomainRule)
      return maybeDomainRule
    } catch (e) {
      this.domainCache.set(d.href, 'ok')
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
      setTimeout(() => this.runFetchEvents(), 10_000)
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
      setTimeout(() => this.runFetchEvents(), 10_000)
      return
    }

    if (res.data.cursor === this.cursor) {
      setTimeout(() => this.runFetchEvents(), 10_000)
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
        await this.setCursor(res.data.cursor)
      }
      setTimeout(() => this.runFetchEvents(), 1_000)
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
    } catch (err) {
      redirectLogger.error({error: err}, 'failed to update safelink cursor')
    }
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
