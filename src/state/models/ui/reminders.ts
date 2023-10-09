import {makeAutoObservable} from 'mobx'
import {isObj, hasProp} from 'lib/type-guards'
import {RootStoreModel} from '../root-store'
import {toHashCode} from 'lib/strings/helpers'

const DAY = 60e3 * 24 * 1 // 1 day (ms)

export class Reminders {
  lastEmailConfirm: Date = new Date()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {serialize: false, hydrate: false},
      {autoBind: true},
    )
  }

  serialize() {
    return {
      lastEmailConfirm: this.lastEmailConfirm
        ? this.lastEmailConfirm.toISOString()
        : undefined,
    }
  }

  hydrate(v: unknown) {
    if (
      isObj(v) &&
      hasProp(v, 'lastEmailConfirm') &&
      typeof v.lastEmailConfirm === 'string'
    ) {
      this.lastEmailConfirm = new Date(v.lastEmailConfirm)
    }
  }

  get shouldRequestEmailConfirmation() {
    const sess = this.rootStore.session.currentSession
    if (!sess) {
      return false
    }
    if (sess.emailConfirmed) {
      return false
    }
    if (this.rootStore.onboarding.isActive) {
      return false
    }
    const today = new Date()
    // shard the users into 2 day of the week buckets
    // (this is to avoid a sudden influx of email updates when
    // this feature rolls out)
    const code = toHashCode(sess.did) % 7
    if (code !== today.getDay() && code !== (today.getDay() + 1) % 7) {
      return false
    }
    // only ask once a day at most, but because of the bucketing
    // this will be more like weekly
    return Number(today) - Number(this.lastEmailConfirm) > DAY
  }

  setEmailConfirmationRequested() {
    this.lastEmailConfirm = new Date()
  }
}
