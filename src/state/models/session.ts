import {makeAutoObservable} from 'mobx'
import {
  BskyAgent,
  ComAtprotoServerDescribeServer as DescribeServer,
} from '@atproto/api'
import {RootStoreModel} from './root-store'

export type ServiceDescription = DescribeServer.OutputSchema

export class SessionModel {
  data: any = {}

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
      hasSession: false,
    })
  }

  get currentSession(): any {
    return undefined
  }

  get hasSession() {
    return false
  }

  clear() {}

  /**
   * Helper to fetch the accounts config settings from an account.
   */
  async describeService(service: string): Promise<ServiceDescription> {
    const agent = new BskyAgent({service})
    const res = await agent.com.atproto.server.describeServer({})
    return res.data
  }

  /**
   * Reloads the session from the server. Useful when account details change, like the handle.
   */
  async reloadFromServer() {}
}
