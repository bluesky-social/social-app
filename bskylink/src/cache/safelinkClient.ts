import {Agent, AtpAgent, CredentialSession} from '@atproto/api'
import {LRUCache} from 'lru-cache'

import {type ServiceConfig} from '../config'
import {SafelinkRule, RulePatternType} from '../db/schema'
import Database from '../db'
import {redirectLogger} from '../logger'

export class SafelinkClient {
  private domainCache: LRUCache<string, SafelinkRule | 'ok'>
  private urlCache: LRUCache<string, SafelinkRule | 'ok'>

  private db: Database

  constructor({
    db,
  }: {
    identifier: string
    password: string
    pdsHost: string
    db: Database
  }) {
    this.domainCache = new LRUCache<string, SafelinkRule | 'ok'>({
      max: 10000,
    })

    this.urlCache = new LRUCache<string, SafelinkRule | 'ok'>({
      max: 25000,
    })

    this.db = db
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
      const maybeUrlRule = await this.getRule(u.href, '#url')
      this.urlCache.set(u.href, maybeUrlRule)
      return maybeUrlRule
    } catch (e) {
      this.urlCache.set(u.href, 'ok')
    }

    try {
      const maybeDomainRule = await this.getRule(u.href, '#domain')
      this.domainCache.set(d.href, maybeDomainRule)
      return maybeDomainRule
    } catch (e) {
      this.domainCache.set(d.href, 'ok')
    }

    return 'ok'
  }

  private getRule(url: string, pattern: RulePatternType) {
    return this.db.db
      .selectFrom('safelink_rule')
      .where('url', '=', url)
      .where('pattern', '=', pattern)
      .executeTakeFirstOrThrow()
  }

  private addRule(rule: SafelinkRule) {
    this.db.db
      .insertInto('safelink_rule')
      .values(rule)
      .execute()
      .catch(err => {
        redirectLogger.error(
          {error: err, rule},
          'failed to add rule to database',
        )
      })

    if (rule.pattern === '#domain') {
      this.domainCache.set(rule.url, rule)
    } else {
      this.urlCache.set(rule.url, rule)
    }
  }

  private async removeRule(rule: SafelinkRule) {
    await this.db.db
      .deleteFrom('safelink_rule')
      .where('pattern', '=', '#domain')
      .where('url', '=', rule.url)
      .execute()
      .catch(err => {
        redirectLogger.error(
          {error: err, rule},
          'failed to remove rule from database',
        )
      })

    if (rule.pattern === '#domain') {
      this.domainCache.delete(rule.url)
    } else {
      this.urlCache.delete(rule.url)
    }
  }

  public run() {
    // poll and add/remove rules as needed
  }
}

export class OzoneAgent {
  public session: CredentialSession
  public agent: AtpAgent
  private cfg: ServiceConfig

  constructor(cfg: ServiceConfig) {
    this.cfg = cfg
    this.session = new CredentialSession(
      new URL(cfg.ozoneUrl || 'http://localhost:2583'),
    )
    this.agent = new AtpAgent(this.session)
  }

  public async getSession(): Promise<CredentialSession> {
    if (!this.session.hasSession) {
      await this.getAgent()
    }
    return this.session
  }

  public async getAgent(): Promise<AtpAgent> {
    if (!this.cfg.ozoneAgentHandle && !this.cfg.ozoneAgentPass) {
      throw new Error(
        'OZONE_AGENT_HANDLE and OZONE_AGENT_PASS environment variables must be set',
      )
    }

    const identifier = this.cfg.ozoneAgentHandle || 'did:plc:invalid'
    const password = this.cfg.ozoneAgentPass || 'invalid'

    if (!this.session.hasSession) {
      await this.session.login({identifier, password})
    }

    try {
      await this.agent.com.atproto.server.getSession()
    } catch (err) {
      if ((err as any).status === 401) {
        await this.session.login({identifier, password})
      }
    }

    return this.agent
  }
}
