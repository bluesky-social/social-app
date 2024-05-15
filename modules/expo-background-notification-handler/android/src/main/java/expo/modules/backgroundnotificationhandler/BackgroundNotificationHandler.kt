package expo.modules.backgroundnotificationhandler

import android.content.Context
import android.util.Log
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

  private fun mutateWithChatMessage(remoteMessage: RemoteMessage): RemoteMessage {
    if (NotificationPrefs(context).getBoolean("playSoundChat")) {
      mutateWithDmSound(remoteMessage)
    }
    return remoteMessage
  }

  // On Android, the notifications always have a sound unless we turn them off. Let's do so to
  // prevent people from just wanting to turn it off in all cases (don't blame them honestly)
  private fun mutateWithNoSound(remoteMessage: RemoteMessage): RemoteMessage {
    remoteMessage.data["sound"] = "false"
    return remoteMessage
  }

  private fun mutateWithDefaultSound(remoteMessage: RemoteMessage): RemoteMessage {
    remoteMessage.data["sound"] = "true"
    return remoteMessage
  }

  private fun mutateWithDmSound(remoteMessage: RemoteMessage): RemoteMessage {
    remoteMessage.data["sound"] = "blueskydm.wav"
    return remoteMessage
  }
}

class MutableRemoteMessage(private val remoteMessage: RemoteMessage) {
  private val data = remoteMessage.data.toMutableMap()

  init {
    remoteMessage.data.forEach { (key, value) ->
      data[key] = value
    }
  }

  fun setData(key: String, value: String?) {
    data[key] = value
  }

  fun build(): RemoteMessage {
    return RemoteMessage.Builder(remoteMessage.to ?: "")
      .setMessageId(remoteMessage.messageId ?: "")
      .setData(data)
      .build()
  }
}