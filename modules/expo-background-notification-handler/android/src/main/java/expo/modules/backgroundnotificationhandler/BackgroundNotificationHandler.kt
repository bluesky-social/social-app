package expo.modules.backgroundnotificationhandler

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

class BackgroundNotificationHandler(
  private val context: Context,
  private val notifInterface: BackgroundNotificationHandlerInterface,
) {
  fun handleMessage(remoteMessage: RemoteMessage) {
    if (ExpoBackgroundNotificationHandlerModule.isForegrounded) {
      // We'll let expo-notifications handle the notification if the app is foregrounded
      return
    }

    val reason = remoteMessage.data["reason"]
    Log.d(TAG, "handleMessage: reason=$reason")

    if (reason == "chat-message" || reason == "chat-reaction") {
      mutateWithChatMessage(remoteMessage)
      packBodyForPresentation(remoteMessage)
    } else {
      mutateWithOtherReason(remoteMessage)
    }

    notifInterface.showMessage(remoteMessage)
  }

  private fun packBodyForPresentation(remoteMessage: RemoteMessage) {
    val body = JSONObject().apply {
      put("reason", remoteMessage.data["reason"])
      put("senderDisplayName", remoteMessage.data["senderDisplayName"])
      put("senderAvatarUrl", remoteMessage.data["senderAvatarUrl"])
      put("senderHandle", remoteMessage.data["senderHandle"])
      put("convoId", remoteMessage.data["convoId"])
    }
    remoteMessage.data["body"] = body.toString()
    Log.d(TAG, "packBodyForPresentation: $body")
  }

  private fun mutateWithChatMessage(remoteMessage: RemoteMessage) {
    if (NotificationPrefs(context).getBoolean("playSoundChat")) {
      // If oreo or higher
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        remoteMessage.data["channelId"] = "chat-messages"
      } else {
        remoteMessage.data["sound"] = "dm.mp3"
      }
    } else {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        remoteMessage.data["channelId"] = "chat-messages-muted"
      } else {
        remoteMessage.data["sound"] = null
      }
    }

    // TODO - Remove this once we have more backend capability
    remoteMessage.data["badge"] = null
  }

  companion object {
    private const val TAG = "BGNotifHandler"
  }

  private fun mutateWithOtherReason(remoteMessage: RemoteMessage) {
    // If oreo or higher
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      // If one of "like", "repost", "follow", "mention", "reply", "quote", "like-via-repost", "repost-via-repost", "subscribed-post"
      // assign to it's eponymous channel. otherwise do nothing, let expo handle it
      when (remoteMessage.data["reason"]) {
        "like", "repost", "follow", "mention", "reply", "quote", "like-via-repost", "repost-via-repost", "subscribed-post" -> {
          remoteMessage.data["channelId"] = remoteMessage.data["reason"]
        }
      }
    }
  }
}
