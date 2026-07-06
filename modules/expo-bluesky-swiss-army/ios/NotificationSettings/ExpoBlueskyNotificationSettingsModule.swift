import EXNotifications
import ExpoModulesCore
import UIKit
import UserNotifications

/*
 * When we request push notification permissions with
 * `provideAppNotificationSettings: true`, iOS adds an in-app notification
 * settings button to the system Settings screen for Bluesky (and may surface
 * it elsewhere, e.g. from a delivered notification). Tapping it launches the
 * app and calls `userNotificationCenter(_:openSettingsFor:)`.
 *
 * expo-notifications owns the `UNUserNotificationCenter` delegate via its
 * `NotificationCenterManager`, which fans that callback out to any registered
 * `NotificationDelegate` through `openSettings(_:)`. We register here and turn
 * the callback into a `bluesky://settings/notifications` deep link so the app's
 * existing linking config routes the user to the notification settings screen.
 */
public class ExpoBlueskyNotificationSettingsModule: Module, NotificationDelegate {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyNotificationSettings")

    OnCreate {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnDestroy {
      NotificationCenterManager.shared.removeDelegate(self)
    }
  }

  public func openSettings(_ notification: UNNotification?) {
    guard let url = URL(string: "bluesky://settings/notifications") else {
      return
    }
    DispatchQueue.main.async {
      UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
  }
}
