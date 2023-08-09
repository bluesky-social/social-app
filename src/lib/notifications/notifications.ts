import * as Notifications from 'expo-notifications'
import {RootStoreModel} from '../../state'
import {resetToTab} from '../../Navigation'
import {devicePlatform} from 'platform/detection'
// import {NotificationsFeedItemModel} from '../../state/models/feeds/notifications'
// import {sanitizeDisplayName} from '../strings/display-names'
// import {AppBskyEmbedImages, AtUri} from '@atproto/api'
// import {enforceLen} from '../strings/helpers'

export function init(store: RootStoreModel) {
  store.onUnreadNotifications(count => Notifications.setBadgeCountAsync(count))
  // store.onPushNotification(d isplayNotificationFromModel)
  // In rare situations, a push token may be changed by the push notification service while the app is running. When a token is rolled, the old one becomes invalid and sending notifications to it will fail. A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.

  store.onSessionLoaded(async () => {
    // request notifications permission once the user has logged in
    const perms = await Notifications.getPermissionsAsync()
    if (!perms.granted) {
      await Notifications.requestPermissionsAsync()
    }

    // register the push token with the server
    const token = await getPushToken()
    if (token) {
      try {
        await store.agent.api.app.bsky.unspecced.registerPushNotificationEndpoint(
          {
            platform: devicePlatform,
            token: token.data,
            endpoint: 'app.bsky.unspecced.putNotificationPushToken',
            appId: 'xyz.blueskyweb.app',
          },
        )
        store.log.debug(
          'Notifications: Sent push token' + token.data + token.type,
        )
      } catch (error) {
        store.log.error('Notifications: Failed to set push token', error)
      }
    }

    // listens for new changes to the push token
    Notifications.addPushTokenListener(async ({data: token, type}) => {
      store.log.debug('Notifications: Push token changed', {token, type})
      if (token) {
        try {
          await store.agent.api.app.bsky.unspecced.registerPushNotificationEndpoint(
            {
              platform: devicePlatform,
              token: token,
              endpoint: 'xyz.blueskyweb.app',
              appId: 'xyz.blueskyweb',
            },
          )
          console.log('SENT PUSH TOKEN')
        } catch (error) {
          store.log.error('Notifications: Failed to set push token', error)
        }
      }
    })
  })
  // handle notifications that are tapped on, regardless of whether the app is in the foreground or background
  Notifications.addNotificationReceivedListener(event => {
    console.log('Notifications: Recevied one notification', event) // TODO: delete this
    store.log.debug('Notifications: received', event)
  })
  const sub = Notifications.addNotificationResponseReceivedListener(event => {
    store.log.debug('Notification received', event)
    console.log('Notification received', event) // TODO: delete this
    if (event.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      store.log.debug('User pressed a notifee, opening notifications')
      resetToTab('NotificationsTab')
    }
  })

  // cleanup function returned
  return () => {
    sub.remove()
  }
}

export function getPushToken() {
  return Notifications.getDevicePushTokenAsync()
}

// export function displayNotification(
//   title: string,
//   body?: string,
//   image?: string,
// ) {
//   const opts: {title: string; body?: string; ios?: any} = {title}
//   if (body) {
//     opts.body = enforceLen(body, 70, true)
//   }
//   if (image) {
//     opts.ios = {
//       attachments: [{url: image}],
//     }
//   }
//   // TODO: display notification
//   // return notifee.displayNotification(opts)
// }

// export function displayNotificationFromModel(
//   notification: NotificationsFeedItemModel,
// ) {
//   let author = sanitizeDisplayName(
//     notification.author.displayName || notification.author.handle,
//   )
//   let title: string
//   let body: string = ''
//   if (notification.isLike) {
//     title = `${author} liked your post`
//     body = notification.additionalPost?.thread?.postRecord?.text || ''
//   } else if (notification.isRepost) {
//     title = `${author} reposted your post`
//     body = notification.additionalPost?.thread?.postRecord?.text || ''
//   } else if (notification.isMention) {
//     title = `${author} mentioned you`
//     body = notification.additionalPost?.thread?.postRecord?.text || ''
//   } else if (notification.isReply) {
//     title = `${author} replied to your post`
//     body = notification.additionalPost?.thread?.postRecord?.text || ''
//   } else if (notification.isFollow) {
//     title = 'New follower!'
//     body = `${author} has followed you`
//   } else if (notification.isCustomFeedLike) {
//     title = `${author} liked your custom feed`
//     body = `${new AtUri(notification.subjectUri).rkey}`
//   } else {
//     return
//   }
//   let image
//   if (
//     AppBskyEmbedImages.isView(
//       notification.additionalPost?.thread?.post.embed,
//     ) &&
//     notification.additionalPost?.thread?.post.embed.images[0]?.thumb
//   ) {
//     image = notification.additionalPost.thread.post.embed.images[0].thumb
//   }
//   return displayNotification(title, body, image)
// }
