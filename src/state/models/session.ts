import {makeAutoObservable} from 'mobx'
import AdxApi from '../../third-party/api'
import {isObj, hasProp} from '../lib/type-guards'
import {RootStoreModel} from './root-store'

interface SessionData {
  service: string
  token: string
  username: string
  userdid: string
}

export class SessionModel {
  data: SessionData | null = null

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
    return this.data
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      const data: SessionData = {
        service: '',
        token: '',
        username: '',
        userdid: '',
      }
      if (hasProp(v, 'service') && typeof v.service === 'string') {
        data.service = v.service
      }
      if (hasProp(v, 'token') && typeof v.token === 'string') {
        data.token = v.token
      }
      if (hasProp(v, 'username') && typeof v.username === 'string') {
        data.username = v.username
      }
      if (hasProp(v, 'userdid') && typeof v.userdid === 'string') {
        data.userdid = v.userdid
      }
      if (data.service && data.token && data.username && data.userdid) {
        this.data = data
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

  async logout() {
    if (this.isAuthed) {
      this.rootStore.api.todo.adx.deleteSession({}).catch((e: any) => {
        console.error('(Minor issue) Failed to delete session on the server', e)
      })
    }
    this.clear()
  }
}
