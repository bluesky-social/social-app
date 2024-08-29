package expo.modules.backgroundnotificationhandler

import android.content.Context
import com.google.firebase.messaging.RemoteMessage

class BackgroundNotificationHandler(
  private val context: Context,
  private val notifInterface: BackgroundNotificationHandlerInterface,
) {
  fun handleMessage(remoteMessage: RemoteMessage) {
    if (ExpoBackgroundNotificationHandlerModule.isForegrounded) {
      // We'll let expo-notifications handle the notification if the app is foregrounded
      return
    }

    if (remoteMessage.data["reason"] == "chat-message") {
      mutateWithChatMessage(remoteMessage)
    }

    notifInterface.showMessage(remoteMessage)
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
}
