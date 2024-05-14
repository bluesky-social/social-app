package expo.modules.backgroundnotificationhandler

import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate

class BackgroundNotificationHandler(private val messagingDelegate: FirebaseMessagingDelegate) {
  fun handleMessage(remoteMessage: RemoteMessage) {
    if (ExpoBackgroundNotificationHandlerModule.isForegrounded) {
      // We'll let expo-notifications handle the notification if the app is foregrounded
      return
    }

    messagingDelegate.showMessage(remoteMessage)

  }
}