import notifee from '@notifee/react-native'
import {AppBskyEmbedImages} from '@atproto/api'
import {NotificationsViewItemModel} from '../../state/models/notifications-view'
import {enforceLen} from '../../lib/strings'

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
  notif: NotificationsViewItemModel,
) {
  let author = notif.author.displayName || notif.author.handle
  let title: string
  let body: string = ''
  if (notif.isUpvote) {
    title = `${author} liked your post`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isRepost) {
    title = `${author} reposted your post`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isMention) {
    title = `${author} mentioned you`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isReply) {
    title = `${author} replied to your post`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isFollow) {
    title = `${author} followed you`
  } else {
    return
  }
  let image
  if (
    AppBskyEmbedImages.isPresented(notif.additionalPost?.thread?.post.embed) &&
    notif.additionalPost?.thread?.post.embed.images[0]?.thumb
  ) {
    image = notif.additionalPost.thread.post.embed.images[0].thumb
  }
  return displayNotification(title, body, image)
}
