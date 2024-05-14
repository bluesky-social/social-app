package expo.modules.backgroundnotificationhandler

import com.google.firebase.messaging.RemoteMessage

class BackgroundNotificationHandler {
  fun handleMessage(remoteMessage: RemoteMessage) {
    if (ExpoBackgroundNotificationHandlerModule.isForegrounded) {
      // We'll let expo-notifications handle the notification if the app is foregrounded
      return
    }

    // Handle various notification types
  }
}