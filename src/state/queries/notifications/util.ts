import {
  AppBskyNotificationListNotifications,
  ModerationOpts,
  moderateProfile,
  moderatePost,
} from '@atproto/api'

// TODO this should be in the sdk as moderateNotification -prf
export function shouldFilterNotif(
  notif: AppBskyNotificationListNotifications.Notification,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  if (!moderationOpts) {
    return false
  }
  const profile = moderateProfile(notif.author, moderationOpts)
  if (
    profile.account.filter ||
    profile.profile.filter ||
    notif.author.viewer?.muted
  ) {
    return true
  }
  if (
    notif.type === 'reply' ||
    notif.type === 'quote' ||
    notif.type === 'mention'
  ) {
    // NOTE: the notification overlaps the post enough for this to work
    const post = moderatePost(notif, moderationOpts)
    if (post.content.filter) {
      return true
    }
  }
  // TODO: thread muting is not being applied
  // (this requires fetching the post)
  return false
}
