import {makeAutoObservable} from 'mobx'
import {
  LabelPreference as APILabelPreference,
  BskyFeedViewPreference,
  BskyThreadViewPreference,
} from '@atproto/api'
import {isObj, hasProp} from 'lib/type-guards'
import {RootStoreModel} from '../root-store'
import {ModerationOpts} from '@atproto/api'

// TEMP we need to permanently convert 'show' to 'ignore', for now we manually convert -prf
export type LabelPreference = APILabelPreference | 'show'
export type FeedViewPreference = BskyFeedViewPreference & {
  lab_mergeFeedEnabled?: boolean | undefined
}
export type ThreadViewPreference = BskyThreadViewPreference & {
  lab_treeViewEnabled?: boolean | undefined
}

export class LabelPreferencesModel {
  nsfw: LabelPreference = 'hide'
  nudity: LabelPreference = 'warn'
  suggestive: LabelPreference = 'warn'
  gore: LabelPreference = 'warn'
  hate: LabelPreference = 'hide'
  spam: LabelPreference = 'hide'
  impersonation: LabelPreference = 'warn'

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true})
  }
}

export class PreferencesModel {
  contentLabels = new LabelPreferencesModel()
  savedFeeds: string[] = []
  pinnedFeeds: string[] = []
  thread: ThreadViewPreference = {
    sort: 'oldest',
    prioritizeFollowedUsers: true,
    lab_treeViewEnabled: false, // experimental
  }

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {}, {autoBind: true})
  }

  serialize() {
    return {
      contentLabels: this.contentLabels,
      savedFeeds: this.savedFeeds,
      pinnedFeeds: this.pinnedFeeds,
    }
  }

  /**
   * The function hydrates an object with properties related to content languages, labels, saved feeds,
   * and pinned feeds that it gets from the parameter `v` (probably local storage)
   * @param {unknown} v - the data object to hydrate from
   */
  hydrate(v: unknown) {
    if (isObj(v)) {
      // check if content labels in preferences exist, then hydrate
      if (hasProp(v, 'contentLabels') && typeof v.contentLabels === 'object') {
        Object.assign(this.contentLabels, v.contentLabels)
      }
      // check if saved feeds in preferences, then hydrate
      if (
        hasProp(v, 'savedFeeds') &&
        Array.isArray(v.savedFeeds) &&
        typeof v.savedFeeds.every(item => typeof item === 'string')
      ) {
        this.savedFeeds = v.savedFeeds
      }
      // check if pinned feeds in preferences exist, then hydrate
      if (
        hasProp(v, 'pinnedFeeds') &&
        Array.isArray(v.pinnedFeeds) &&
        typeof v.pinnedFeeds.every(item => typeof item === 'string')
      ) {
        this.pinnedFeeds = v.pinnedFeeds
      }
    }
  }

  // moderation
  // =

  /**
   * @deprecated use `getModerationOpts` from '#/state/queries/preferences/moderation' instead
   */
  get moderationOpts(): ModerationOpts {
    return {
      userDid: this.rootStore.session.currentSession?.did || '',
      adultContentEnabled: false,
      labels: {
        // TEMP translate old settings until this UI can be migrated -prf
        porn: tempfixLabelPref(this.contentLabels.nsfw),
        sexual: tempfixLabelPref(this.contentLabels.suggestive),
        nudity: tempfixLabelPref(this.contentLabels.nudity),
        nsfl: tempfixLabelPref(this.contentLabels.gore),
        corpse: tempfixLabelPref(this.contentLabels.gore),
        gore: tempfixLabelPref(this.contentLabels.gore),
        torture: tempfixLabelPref(this.contentLabels.gore),
        'self-harm': tempfixLabelPref(this.contentLabels.gore),
        'intolerant-race': tempfixLabelPref(this.contentLabels.hate),
        'intolerant-gender': tempfixLabelPref(this.contentLabels.hate),
        'intolerant-sexual-orientation': tempfixLabelPref(
          this.contentLabels.hate,
        ),
        'intolerant-religion': tempfixLabelPref(this.contentLabels.hate),
        intolerant: tempfixLabelPref(this.contentLabels.hate),
        'icon-intolerant': tempfixLabelPref(this.contentLabels.hate),
        spam: tempfixLabelPref(this.contentLabels.spam),
        impersonation: tempfixLabelPref(this.contentLabels.impersonation),
        scam: 'warn',
      },
      labelers: [
        {
          labeler: {
            did: '',
            displayName: 'Bluesky Social',
          },
          labels: {},
        },
      ],
    }
  }

  // feeds
  // =

  isPinnedFeed(uri: string) {
    return this.pinnedFeeds.includes(uri)
  }

  /**
   * @deprecated use `useAddSavedFeedMutation` from `#/state/queries/preferences` instead
   */
  async addSavedFeed(_v: string) {}

  /**
   * @deprecated use `useRemoveSavedFeedMutation` from `#/state/queries/preferences` instead
   */
  async removeSavedFeed(_v: string) {}

  /**
   * @deprecated use `usePinFeedMutation` from `#/state/queries/preferences` instead
   */
  async addPinnedFeed(_v: string) {}

  /**
   * @deprecated use `useUnpinFeedMutation` from `#/state/queries/preferences` instead
   */
  async removePinnedFeed(_v: string) {}
}

// TEMP we need to permanently convert 'show' to 'ignore', for now we manually convert -prf
// TODO do we need this?
function tempfixLabelPref(pref: LabelPreference): APILabelPreference {
  if (pref === 'show') {
    return 'ignore'
  }
  return pref
}
