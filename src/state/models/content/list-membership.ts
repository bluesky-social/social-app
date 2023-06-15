import {makeAutoObservable} from 'mobx'
import {AtUri, AppBskyGraphListitem} from '@atproto/api'
import {runInAction} from 'mobx'
import {RootStoreModel} from '../root-store'

const PAGE_SIZE = 100
interface Membership {
  uri: string
  value: AppBskyGraphListitem.Record
}

interface ListitemRecord {
  uri: string
  value: AppBskyGraphListitem.Record
}

interface ListitemListResponse {
  cursor?: string
  records: ListitemRecord[]
}

export class ListMembershipModel {
  // data
  memberships: Membership[] = []

  constructor(public rootStore: RootStoreModel, public subject: string) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  // public api
  // =

  async fetch() {
    // NOTE
    // this approach to determining list membership is too inefficient to work at any scale
    // it needs to be replaced with server side list membership queries
    // -prf
    let cursor
    let records: ListitemRecord[] = []
    for (let i = 0; i < 100; i++) {
      const res: ListitemListResponse =
        await this.rootStore.agent.app.bsky.graph.listitem.list({
          repo: this.rootStore.me.did,
          cursor,
          limit: PAGE_SIZE,
        })
      records = records.concat(
        res.records.filter(record => record.value.subject === this.subject),
      )
      cursor = res.cursor
      if (!cursor) {
        break
      }
    }
    runInAction(() => {
      this.memberships = records
    })
  }

  getMembership(listUri: string) {
    return this.memberships.find(m => m.value.list === listUri)
  }

  isMember(listUri: string) {
    return !!this.getMembership(listUri)
  }

  async add(listUri: string) {
    if (this.isMember(listUri)) {
      return
    }
    const res = await this.rootStore.agent.app.bsky.graph.listitem.create(
      {
        repo: this.rootStore.me.did,
      },
      {
        subject: this.subject,
        list: listUri,
        createdAt: new Date().toISOString(),
      },
    )
    const {rkey} = new AtUri(res.uri)
    const record = await this.rootStore.agent.app.bsky.graph.listitem.get({
      repo: this.rootStore.me.did,
      rkey,
    })
    runInAction(() => {
      this.memberships = this.memberships.concat([record])
    })
  }

  async remove(listUri: string) {
    const membership = this.getMembership(listUri)
    if (!membership) {
      return
    }
    const {rkey} = new AtUri(membership.uri)
    await this.rootStore.agent.app.bsky.graph.listitem.delete({
      repo: this.rootStore.me.did,
      rkey,
    })
    runInAction(() => {
      this.memberships = this.memberships.filter(m => m.value.list !== listUri)
    })
  }

  async updateTo(uris: string[]) {
    for (const uri of uris) {
      await this.add(uri)
    }
    for (const membership of this.memberships) {
      if (!uris.includes(membership.value.list)) {
        await this.remove(membership.value.list)
      }
    }
  }
}
