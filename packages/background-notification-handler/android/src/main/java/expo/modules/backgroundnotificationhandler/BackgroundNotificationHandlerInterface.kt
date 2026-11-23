package expo.modules.backgroundnotificationhandler

import com.google.firebase.messaging.RemoteMessage

interface BackgroundNotificationHandlerInterface {
  fun showMessage(remoteMessage: RemoteMessage)
}
