package expo.modules.backgroundnotificationhandler

import android.content.Context
import com.google.firebase.messaging.RemoteMessage

class BackgroundNotificationHandler(
  private val context: Context,
  private val notifInterface: BackgroundNotificationHandlerInterface
) {
  fun handleMessage(remoteMessage: RemoteMessage) {
    if (ExpoBackgroundNotificationHandlerModule.isForegrounded) {
      // We'll let expo-notifications handle the notification if the app is foregrounded
      return
    }

    if (remoteMessage.data.getValue("reason") == "chat-message") {
      mutateWithChatMessage(remoteMessage)
    }

    notifInterface.showMessage(remoteMessage)
  }

  private fun mutateWithChatMessage(remoteMessage: RemoteMessage) {
    if (NotificationPrefs(context).getBoolean("playSoundChat")) {
      remoteMessage.data["channelId"] = "chat-messages-sound"
    } else {
      remoteMessage.data["channelId"] = "chat-messages"
      remoteMessage.data["sound"] = null
    }
  }
}
