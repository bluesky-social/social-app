import {
  AppBskyActorDefs,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from '@atproto/api'
import {
  CONFIGURABLE_LABEL_GROUPS,
  ILLEGAL_LABEL_GROUP,
  UNKNOWN_LABEL_GROUP,
} from './const'
import {
  Label,
  LabelValGroup,
  ModerationBehaviorCode,
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
    return {
      avatar,
      list: hide('Post from an account you muted.'),
      thread: warn('Post from an account you muted.'),
      view: warn('Post from an account you muted.'),
    }
  }

  // warning cases
  if (postPref.pref === 'warn') {
    if (postPref.desc.imagesOnly) {
      return {
        avatar,
        list: warnContent(postPref.desc.warning), // TODO make warnImages when there's time
        thread: warnContent(postPref.desc.warning), // TODO make warnImages when there's time
        view: warnContent(postPref.desc.warning), // TODO make warnImages when there's time
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

export function getProfileModeration(
  store: RootStoreModel,
  profileLabels: ProfileLabelInfo,
): ProfileModeration {
  const accountPref = store.preferences.getLabelPreference(
    profileLabels.accountLabels,
  )
  const profilePref = store.preferences.getLabelPreference(
    profileLabels.profileLabels,
  )

  // avatar
  let avatar = {
    warn: accountPref.pref === 'hide' || accountPref.pref === 'warn',
    blur:
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
      list: warn(accountPref.desc.warning),
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
    list: show(),
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
  }
}

export function getEmbedLabels(embed?: Embed): Label[] {
  if (!embed) {
    return []
  }
  if (
    AppBskyEmbedRecordWithMedia.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record.record) &&
    AppBskyFeedPost.isRecord(embed.record.record.value) &&
    AppBskyFeedPost.validateRecord(embed.record.record.value).success
  ) {
    return embed.record.record.labels || []
  }
  return []
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

function warnImages(reason: string) {
  return {
    behavior: ModerationBehaviorCode.WarnImages,
    reason,
  }
}
