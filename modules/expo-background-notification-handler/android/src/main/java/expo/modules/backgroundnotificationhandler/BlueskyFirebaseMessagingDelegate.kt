package expo.modules.backgroundnotificationhandler

import android.content.Context
import android.os.Bundle
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate

/**
 * Notification channel for all chat pushes. Created in JS by
 * `src/lib/notifications/channels.ts`, so the two must match.
 */
const val CHAT_CHANNEL_ID = "chat"

class BlueskyFirebaseMessagingDelegate(
  context: Context,
) : FirebaseMessagingDelegate(context) {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val reason = remoteMessage.data["reason"]
    when {
      // Sent when notifications are read on another device. These have no
      // content and nothing handles them yet, so don't hand them to expo.
      reason?.startsWith("mark-read-") == true -> return
      reason?.startsWith("chat-") == true ->
        super.onMessageReceived(withChannelId(remoteMessage, CHAT_CHANNEL_ID))
      else -> super.onMessageReceived(remoteMessage)
    }
  }

  /**
   * Chat pushes are data-only, so their channel has to be chosen on-device.
   * expo reads it from `data["channelId"]`, and falls back to its default
   * channel if the channel hasn't been created yet.
   *
   * We can't just write to `remoteMessage.data`: it's a copy (or a cache) of
   * the message's backing bundle, and expo parcels the message to its
   * receiver, which rebuilds it from that bundle. Instead, build a new message
   * from an edited copy of the bundle.
   */
  private fun withChannelId(
    remoteMessage: RemoteMessage,
    channelId: String,
  ): RemoteMessage {
    val bundle = remoteMessage.toIntent().extras ?: Bundle()
    bundle.putString("channelId", channelId)
    return RemoteMessage(bundle)
  }
}
