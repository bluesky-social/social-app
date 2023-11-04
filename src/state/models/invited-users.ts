import {makeAutoObservable, runInAction} from 'mobx'
import {ComAtprotoServerDefs, AppBskyActorDefs} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {isObj, hasProp, isStrArray} from 'lib/type-guards'
import {logger} from '#/logger'

export class InvitedUsers {
  copiedInvites: string[] = []
  seenDids: string[] = []
  profiles: AppBskyActorDefs.ProfileViewDetailed[] = []

  get numNotifs() {
    return this.profiles.length
  }

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {rootStore: false, serialize: false, hydrate: false},
      {autoBind: true},
    )
  }

  serialize() {
    return {seenDids: this.seenDids, copiedInvites: this.copiedInvites}
  }

  hydrate(v: unknown) {
    if (isObj(v) && hasProp(v, 'seenDids') && isStrArray(v.seenDids)) {
      this.seenDids = v.seenDids
    }
    if (
      isObj(v) &&
      hasProp(v, 'copiedInvites') &&
      isStrArray(v.copiedInvites)
    ) {
      this.copiedInvites = v.copiedInvites
    }
  }

  async fetch(invites: ComAtprotoServerDefs.InviteCode[]) {
    // pull the dids of invited users not marked seen
    const dids = []
    for (const invite of invites) {
      for (const use of invite.uses) {
        if (!this.seenDids.includes(use.usedBy)) {
          dids.push(use.usedBy)
        }
      }
    }

    // fetch their profiles
    this.profiles = []
    if (dids.length) {
      try {
        const res = await this.rootStore.agent.app.bsky.actor.getProfiles({
          actors: dids,
        })
        runInAction(() => {
          // save the ones following -- these are the ones we want to notify the user about
          this.profiles = res.data.profiles.filter(
            profile => !profile.viewer?.following,
          )
        })
        this.rootStore.me.follows.hydrateMany(this.profiles)
      } catch (e) {
        logger.error('Failed to fetch profiles for invited users', {
          error: e,
        })
      }
    }
  }

  isInviteCopied(invite: string) {
    return this.copiedInvites.includes(invite)
  }

  setInviteCopied(invite: string) {
    if (!this.isInviteCopied(invite)) {
      this.copiedInvites.push(invite)
    }
  }

  markSeen(did: string) {
    this.seenDids.push(did)
    this.profiles = this.profiles.filter(profile => profile.did !== did)
  }
}
