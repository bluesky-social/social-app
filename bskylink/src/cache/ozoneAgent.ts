import {AtpAgent, CredentialSession} from '@atproto/api'

import {type ServiceConfig} from '../config'

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
