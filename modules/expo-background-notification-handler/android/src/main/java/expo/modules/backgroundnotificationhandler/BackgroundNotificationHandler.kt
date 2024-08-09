package expo.modules.backgroundnotificationhandler

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import expo.modules.blueskyswissarmy.sharedprefs.SharedPrefs

enum class NotificationType(
  val type: String,
) {
  Like("like"),
  Repost("repost"),
  Follow("follow"),
  Reply("reply"),
  Quote("quote"),
  ChatMessage("chat-message"),
  MarkReadGeneric("mark-read-generic"),
  MarkReadMessages("mark-read-messages"),
}

class BackgroundNotificationHandler(
  private val context: Context,
  private val notifInterface: BackgroundNotificationHandlerInterface,
) {
  fun handleMessage(remoteMessage: RemoteMessage) {
    if (ExpoBackgroundNotificationHandlerModule.isForegrounded) {
      // We'll let expo-notifications handle the notification if the app is foregrounded
      return
    }

    val type = NotificationType.valueOf(remoteMessage.data["reason"] ?: return)

    if (type == NotificationType.ChatMessage) {
      mutateWithChatMessage(remoteMessage)
    } else if (type == NotificationType.MarkReadGeneric || type == NotificationType.MarkReadMessages) {
      return
    }

    notifInterface.showMessage(remoteMessage)
  }

  private fun mutateWithChatMessage(remoteMessage: RemoteMessage) {
    if (SharedPrefs(context).getBoolean("playSoundChat") == true) {
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
}
