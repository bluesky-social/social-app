import {makeAutoObservable} from 'mobx'
import AdxApi from '../../third-party/api'
import type * as GetAccountsConfig from '../../third-party/api/src/types/todo/adx/getAccountsConfig'
import {isObj, hasProp} from '../lib/type-guards'
import {RootStoreModel} from './root-store'

export type ServiceDescription = GetAccountsConfig.OutputSchema

interface SessionData {
  service: string
  token: string
  username: string
  userdid: string
}

export enum OnboardingStage {
  Init = 'init',
}

interface OnboardingState {
  stage: OnboardingStage
}

export class SessionModel {
  data: SessionData | null = null
  onboardingState: OnboardingState | null = null

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
      serialize: false,
      hydrate: false,
    })
  }

  get isAuthed() {
    return this.data !== null
  }

  serialize(): unknown {
    return {
      data: this.data,
      onboardingState: this.onboardingState,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'data') && isObj(v.data)) {
        const data: SessionData = {
          service: '',
          token: '',
          username: '',
          userdid: '',
        }
        if (hasProp(v.data, 'service') && typeof v.data.service === 'string') {
          data.service = v.data.service
        }
        if (hasProp(v.data, 'token') && typeof v.data.token === 'string') {
          data.token = v.data.token
        }
        if (
          hasProp(v.data, 'username') &&
          typeof v.data.username === 'string'
        ) {
          data.username = v.data.username
        }
        if (hasProp(v.data, 'userdid') && typeof v.data.userdid === 'string') {
          data.userdid = v.data.userdid
        }
        if (data.service && data.token && data.username && data.userdid) {
          this.data = data
        }
      }
      if (
        this.data &&
        hasProp(v, 'onboardingState') &&
        isObj(v.onboardingState)
      ) {
        if (
          hasProp(v.onboardingState, 'stage') &&
          typeof v.onboardingState === 'string'
        ) {
          this.onboardingState = v.onboardingState
        }
      }
    }
  }

  clear() {
    console.log('clear()')
    this.data = null
  }

  setState(data: SessionData) {
    this.data = data
  }

  private configureApi(): boolean {
    if (!this.data) {
      return false
    }

    try {
      const serviceUri = new URL(this.data.service)
      this.rootStore.api.xrpc.uri = serviceUri
    } catch (e) {
      console.error(
        `Invalid service URL: ${this.data.service}. Resetting session.`,
      )
      console.error(e)
      this.clear()
      return false
    }

    this.rootStore.api.setHeader('Authorization', `Bearer ${this.data.token}`)
    return true
  }

  async setup(): Promise<void> {
    if (!this.configureApi()) {
      return
    }

    try {
      const sess = await this.rootStore.api.todo.adx.getSession({})
      if (sess.success && this.data && this.data.userdid === sess.data.did) {
        return // success
      }
    } catch (e: any) {}

    this.clear() // invalid session cached
  }

  async describeService(service: string): Promise<ServiceDescription> {
    const api = AdxApi.service(service)
    const res = await api.todo.adx.getAccountsConfig({})
    return res.data
  }

  async login({
    service,
    username,
    password,
  }: {
    service: string
    username: string
    password: string
  }) {
    const api = AdxApi.service(service)
    const res = await api.todo.adx.createSession({}, {username, password})
    if (res.data.jwt) {
      this.setState({
        service: service,
        token: res.data.jwt,
        username: res.data.name,
        userdid: res.data.did,
      })
      this.configureApi()
    }
  }

  async createAccount({
    service,
    email,
    password,
    username,
    inviteCode,
  }: {
    service: string
    email: string
    password: string
    username: string
    inviteCode?: string
  }) {
    const api = AdxApi.service(service)
    const res = await api.todo.adx.createAccount(
      {},
      {username, password, email, inviteCode},
    )
    if (res.data.jwt) {
      this.setState({
        service: service,
        token: res.data.jwt,
        username: res.data.name,
        userdid: res.data.did,
      })
      this.setOnboardingStage(OnboardingStage.Init)
      this.configureApi()
    }
  }

  async logout() {
    if (this.isAuthed) {
      this.rootStore.api.todo.adx.deleteSession({}).catch((e: any) => {
        console.error('(Minor issue) Failed to delete session on the server', e)
      })
    }
    this.clear()
  }

  setOnboardingStage(stage: OnboardingStage | null) {
    if (stage === null) {
      this.onboardingState = null
    } else {
      this.onboardingState = {stage}
    }
  }
}
