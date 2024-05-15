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
    } else {
      mutateWithNoSound(remoteMessage)
    }

    notifInterface.showMessage(remoteMessage)
  }

  private fun mutateWithChatMessage(remoteMessage: RemoteMessage) {
    if (NotificationPrefs(context).getBoolean("playSoundChat")) {
      mutateWithDmSound(remoteMessage)
    }
  }

  private fun mutateWithDefaultSound(remoteMessage: RemoteMessage) {
    remoteMessage.data["sound"] = "true"
  }

  private fun mutateWithDmSound(remoteMessage: RemoteMessage) {
    remoteMessage.data["sound"] = "dm.mp3"
  }

  // On Android, the notifications always have a sound unless we turn them off. Let's do so to
  // prevent people from just wanting to turn it off in all cases (don't blame them honestly)
  private fun mutateWithNoSound(remoteMessage: RemoteMessage) {
    remoteMessage.data["sound"] = "false"
  }
}
