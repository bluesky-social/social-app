package expo.modules.backgroundnotificationhandler

import expo.modules.notifications.service.ExpoFirebaseMessagingService
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

/**
 * Replaces expo-notifications' FCM service so we can adjust incoming messages
 * before expo handles them. expo registers its service at intent-filter
 * priority -1 so that apps can do this - ours is registered at the default
 * priority in this module's AndroidManifest.xml, so FCM delivers to it instead.
 */
class BlueskyFirebaseMessagingService : ExpoFirebaseMessagingService() {
  override val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
    BlueskyFirebaseMessagingDelegate(this)
  }
}
