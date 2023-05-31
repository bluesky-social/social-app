import notifee, {EventType} from '@notifee/react-native'
import {AppBskyEmbedImages} from '@atproto/api'
import {RootStoreModel} from 'state/models/root-store'
import {NotificationsFeedItemModel} from 'state/models/feeds/notifications'
import {enforceLen} from 'lib/strings/helpers'
import {sanitizeDisplayName} from './strings/display-names'
import {resetToTab} from '../Navigation'

export function init(store: RootStoreModel) {
  store.onUnreadNotifications(count => notifee.setBadgeCount(count))
  store.onPushNotification(displayNotificationFromModel)
  store.onSessionLoaded(() => {
    // request notifications permission once the user has logged in
    notifee.requestPermission()
  })
  notifee.onForegroundEvent(async ({type}: {type: EventType}) => {
    store.log.debug('Notifee foreground event', {type})
    if (type === EventType.PRESS) {
      store.log.debug('User pressed a notifee, opening notifications')
      resetToTab('NotificationsTab')
    }
  })
  notifee.onBackgroundEvent(async _e => {}) // notifee requires this but we handle it with onForegroundEvent
}

export function displayNotification(
  title: string,
  body?: string,
  image?: string,
) {
  const opts: {title: string; body?: string; ios?: any} = {title}
  if (body) {
    opts.body = enforceLen(body, 70, true)
  }
  if (image) {
    opts.ios = {
      attachments: [{url: image}],
    }
  }
  return notifee.displayNotification(opts)
}

export function displayNotificationFromModel(
  notification: NotificationsFeedItemModel,
) {
  let author = sanitizeDisplayName(
    notification.author.displayName || notification.author.handle,
  )
  let title: string
  let body: string = ''
  if (notification.isLike) {
    title = `${author} liked your post`
    body = notification.additionalPost?.thread?.postRecord?.text || ''
  } else if (notification.isRepost) {
    title = `${author} reposted your post`
    body = notification.additionalPost?.thread?.postRecord?.text || ''
  } else if (notification.isMention) {
    title = `${author} mentioned you`
    body = notification.additionalPost?.thread?.postRecord?.text || ''
  } else if (notification.isReply) {
    title = `${author} replied to your post`
    body = notification.additionalPost?.thread?.postRecord?.text || ''
  } else if (notification.isFollow) {
    title = 'New follower!'
    body = `${author} has followed you`
  } else {
    return
  }
  let image
  if (
    AppBskyEmbedImages.isView(
      notification.additionalPost?.thread?.post.embed,
    ) &&
    notification.additionalPost?.thread?.post.embed.images[0]?.thumb
  ) {
    image = notification.additionalPost.thread.post.embed.images[0].thumb
  }
  return displayNotification(title, body, image)
}
