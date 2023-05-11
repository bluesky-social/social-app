import {
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedRecord,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from '@atproto/api'
import {
  CONFIGURABLE_LABEL_GROUPS,
  ILLEGAL_LABEL_GROUP,
  ALWAYS_FILTER_LABEL_GROUP,
  ALWAYS_WARN_LABEL_GROUP,
  UNKNOWN_LABEL_GROUP,
} from './const'
import {
  Label,
  LabelValGroup,
  ModerationBehaviorCode,
  ModerationBehavior,
  PostModeration,
  ProfileModeration,
  PostLabelInfo,
  ProfileLabelInfo,
} from './types'
import {RootStoreModel} from 'state/index'

type Embed =
  | AppBskyEmbedRecord.View
  | AppBskyEmbedImages.View
  | AppBskyEmbedExternal.View
  | AppBskyEmbedRecordWithMedia.View
  | {$type: string; [k: string]: unknown}

export function getLabelValueGroup(labelVal: string): LabelValGroup {
  let id: keyof typeof CONFIGURABLE_LABEL_GROUPS
  for (id in CONFIGURABLE_LABEL_GROUPS) {
    if (ILLEGAL_LABEL_GROUP.values.includes(labelVal)) {
      return ILLEGAL_LABEL_GROUP
    }
    if (ALWAYS_FILTER_LABEL_GROUP.values.includes(labelVal)) {
      return ALWAYS_FILTER_LABEL_GROUP
    }
    if (ALWAYS_WARN_LABEL_GROUP.values.includes(labelVal)) {
      return ALWAYS_WARN_LABEL_GROUP
    }
    if (CONFIGURABLE_LABEL_GROUPS[id].values.includes(labelVal)) {
      return CONFIGURABLE_LABEL_GROUPS[id]
    }
  }
  return UNKNOWN_LABEL_GROUP
}

export function getPostModeration(
  store: RootStoreModel,
  postInfo: PostLabelInfo,
): PostModeration {
  const accountPref = store.preferences.getLabelPreference(
    postInfo.accountLabels,
  )
  const profilePref = store.preferences.getLabelPreference(
    postInfo.profileLabels,
  )
  const postPref = store.preferences.getLabelPreference(postInfo.postLabels)

  // avatar
  let avatar = {
    warn: accountPref.pref === 'hide' || accountPref.pref === 'warn',
    blur:
      postInfo.isBlocking ||
      accountPref.pref === 'hide' ||
      accountPref.pref === 'warn' ||
      profilePref.pref === 'hide' ||
      profilePref.pref === 'warn',
  }

  // hide no-override cases
  if (accountPref.pref === 'hide' && accountPref.desc.id === 'illegal') {
    return hidePostNoOverride(accountPref.desc.warning)
  }
  if (profilePref.pref === 'hide' && profilePref.desc.id === 'illegal') {
    return hidePostNoOverride(profilePref.desc.warning)
  }
  if (postPref.pref === 'hide' && postPref.desc.id === 'illegal') {
    return hidePostNoOverride(postPref.desc.warning)
  }

  // hide cases
  if (postInfo.isBlocking) {
    return {
      avatar,
      list: hide('Post from an account you blocked.'),
      thread: hide('Post from an account you blocked.'),
      view: warn('Post from an account you blocked.'),
    }
  }
  if (postInfo.isBlockedBy) {
    return {
      avatar,
      list: hide('Post from an account that has blocked you.'),
      thread: hide('Post from an account that has blocked you.'),
      view: warn('Post from an account that has blocked you.'),
    }
  }
  if (accountPref.pref === 'hide') {
    return {
      avatar,
      list: hide(accountPref.desc.warning),
      thread: hide(accountPref.desc.warning),
      view: warn(accountPref.desc.warning),
    }
  }
  if (profilePref.pref === 'hide') {
    return {
      avatar,
      list: hide(profilePref.desc.warning),
      thread: hide(profilePref.desc.warning),
      view: warn(profilePref.desc.warning),
    }
  }
  if (postPref.pref === 'hide') {
    return {
      avatar,
      list: hide(postPref.desc.warning),
      thread: hide(postPref.desc.warning),
      view: warn(postPref.desc.warning),
    }
  }

  // muting
  if (postInfo.isMuted) {
    let msg = 'Post from an account you muted.'
    if (postInfo.mutedByList) {
      msg = `Muted by ${postInfo.mutedByList.name}`
    }
    return {
      avatar,
      list: isMute(hide(msg)),
      thread: isMute(warn(msg)),
      view: isMute(warn(msg)),
    }
  }

  // warning cases
  if (postPref.pref === 'warn') {
    if (postPref.desc.isAdultImagery) {
      return {
        avatar,
        list: warnImages(postPref.desc.warning),
        thread: warnImages(postPref.desc.warning),
        view: warnImages(postPref.desc.warning),
      }
    }
    return {
      avatar,
      list: warnContent(postPref.desc.warning),
      thread: warnContent(postPref.desc.warning),
      view: warnContent(postPref.desc.warning),
    }
  }
  if (accountPref.pref === 'warn') {
    return {
      avatar,
      list: warnContent(accountPref.desc.warning),
      thread: warnContent(accountPref.desc.warning),
      view: warnContent(accountPref.desc.warning),
    }
  }

  return {
    avatar,
    list: show(),
    thread: show(),
    view: show(),
  }
}

export function mergePostModerations(
  moderations: PostModeration[],
): PostModeration {
  const merged: PostModeration = {
    avatar: {warn: false, blur: false},
    list: show(),
    thread: show(),
    view: show(),
  }
  for (const mod of moderations) {
    if (mod.list.behavior === ModerationBehaviorCode.Hide) {
      merged.list = mod.list
    }
    if (mod.thread.behavior === ModerationBehaviorCode.Hide) {
      merged.thread = mod.thread
    }
    if (mod.view.behavior === ModerationBehaviorCode.Hide) {
      merged.view = mod.view
    }
  }
  return merged
}

export function getProfileModeration(
  store: RootStoreModel,
  profileInfo: ProfileLabelInfo,
): ProfileModeration {
  const accountPref = store.preferences.getLabelPreference(
    profileInfo.accountLabels,
  )
  const profilePref = store.preferences.getLabelPreference(
    profileInfo.profileLabels,
  )

  // avatar
  let avatar = {
    warn: accountPref.pref === 'hide' || accountPref.pref === 'warn',
    blur:
      profileInfo.isBlocking ||
      accountPref.pref === 'hide' ||
      accountPref.pref === 'warn' ||
      profilePref.pref === 'hide' ||
      profilePref.pref === 'warn',
  }

  // hide no-override cases
  if (accountPref.pref === 'hide' && accountPref.desc.id === 'illegal') {
    return hideProfileNoOverride(accountPref.desc.warning)
  }
  if (profilePref.pref === 'hide' && profilePref.desc.id === 'illegal') {
    return hideProfileNoOverride(profilePref.desc.warning)
  }

  // hide cases
  if (accountPref.pref === 'hide') {
    return {
      avatar,
      list: hide(accountPref.desc.warning),
      view: hide(accountPref.desc.warning),
    }
  }
  if (profilePref.pref === 'hide') {
    return {
      avatar,
      list: hide(profilePref.desc.warning),
      view: hide(profilePref.desc.warning),
    }
  }

  // warn cases
  if (accountPref.pref === 'warn') {
    return {
      avatar,
      list:
        profileInfo.isBlocking || profileInfo.isBlockedBy
          ? hide('Blocked account')
          : warn(accountPref.desc.warning),
      view: warn(accountPref.desc.warning),
    }
  }
  // we don't warn for this
  // if (profilePref.pref === 'warn') {
  //   return {
  //     avatar,
  //     list: warn(profilePref.desc.warning),
  //     view: warn(profilePref.desc.warning),
  //   }
  // }

  return {
    avatar,
    list: profileInfo.isBlocking ? hide('Blocked account') : show(),
    view: show(),
  }
}

export function getProfileViewBasicLabelInfo(
  profile: AppBskyActorDefs.ProfileViewBasic,
): ProfileLabelInfo {
  return {
    accountLabels: filterAccountLabels(profile.labels),
    profileLabels: filterProfileLabels(profile.labels),
    isMuted: profile.viewer?.muted || false,
    isBlocking: !!profile.viewer?.blocking || false,
    isBlockedBy: !!profile.viewer?.blockedBy || false,
  }
}

export function getEmbedLabels(embed?: Embed): Label[] {
  if (!embed) {
    return []
  }
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record)
  ) {
    return embed.record.labels || []
  }
  return []
}

export function getEmbedMuted(embed?: Embed): boolean {
  if (!embed) {
    return false
  }
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record)
  ) {
    return !!embed.record.author.viewer?.muted
  }
  return false
}

export function getEmbedMutedByList(
  embed?: Embed,
): AppBskyGraphDefs.ListViewBasic | undefined {
  if (!embed) {
    return undefined
  }
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record)
  ) {
    return embed.record.author.viewer?.mutedByList
  }
  return undefined
}

export function getEmbedBlocking(embed?: Embed): boolean {
  if (!embed) {
    return false
  }
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record)
  ) {
    return !!embed.record.author.viewer?.blocking
  }
  return false
}

export function getEmbedBlockedBy(embed?: Embed): boolean {
  if (!embed) {
    return false
  }
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record)
  ) {
    return !!embed.record.author.viewer?.blockedBy
  }
  return false
}

export function filterAccountLabels(labels?: Label[]): Label[] {
  if (!labels) {
    return []
  }
  return labels.filter(
    label => !label.uri.endsWith('/app.bsky.actor.profile/self'),
  )
}

export function filterProfileLabels(labels?: Label[]): Label[] {
  if (!labels) {
    return []
  }
  return labels.filter(label =>
    label.uri.endsWith('/app.bsky.actor.profile/self'),
  )
}

// internal methods
// =

function show() {
  return {
    behavior: ModerationBehaviorCode.Show,
  }
}

function hidePostNoOverride(reason: string) {
  return {
    avatar: {warn: true, blur: true},
    list: hideNoOverride(reason),
    thread: hideNoOverride(reason),
    view: hideNoOverride(reason),
  }
}

function hideProfileNoOverride(reason: string) {
  return {
    avatar: {warn: true, blur: true},
    list: hideNoOverride(reason),
    view: hideNoOverride(reason),
  }
}

function hideNoOverride(reason: string) {
  return {
    behavior: ModerationBehaviorCode.Hide,
    reason,
    noOverride: true,
  }
}

function hide(reason: string) {
  return {
    behavior: ModerationBehaviorCode.Hide,
    reason,
  }
}

function warn(reason: string) {
  return {
    behavior: ModerationBehaviorCode.Warn,
    reason,
  }
}

function warnContent(reason: string) {
  return {
    behavior: ModerationBehaviorCode.WarnContent,
    reason,
  }
}

function isMute(behavior: ModerationBehavior): ModerationBehavior {
  behavior.isMute = true
  return behavior
}

function warnImages(reason: string) {
  return {
    behavior: ModerationBehaviorCode.WarnImages,
    reason,
  }
}
