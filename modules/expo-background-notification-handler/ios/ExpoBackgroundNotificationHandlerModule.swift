import ExpoModulesCore
import ExpoBlueskySwissArmy

let APP_GROUP = "group.app.bsky"

let DEFAULTS: [String: Any] = [
  "playSoundChat": true,
  "playSoundFollow": false,
  "playSoundLike": false,
  "playSoundMention": false,
  "playSoundQuote": false,
  "playSoundReply": false,
  "playSoundRepost": false,
  "badgeCount": 0
]

let INCREMENTED_FOR_KEY = "incremented-for-convos"

/*
 * The purpose of this module is to store values that are needed by the notification service
 * extension. Since we would rather get and store values such as age or user mute state
 * while the app is foregrounded, we should use this module liberally. We should aim to keep
 * background fetches to a minimum (two or three times per hour) while the app is backgrounded
 * or killed
 */
public class ExpoBackgroundNotificationHandlerModule: Module {
  let userDefaults = UserDefaults(suiteName: APP_GROUP)

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundNotificationHandler")

    OnCreate {
      DEFAULTS.forEach { p in
        if !SharedPrefs.shared.hasValue(p.key) {
          SharedPrefs.shared._setAnyValue(p.key, p.value)
        }
      }
    }

    AsyncFunction("resetGenericCountAsync") {
      SharedPrefs.shared.setValue(BadgeType.generic.toKeyName(), 0)
    }

    AsyncFunction("maybeIncrementMessagesCountAsync") { (convoId: String) in
      guard !SharedPrefs.shared.setContains(INCREMENTED_FOR_KEY, convoId) else {
        return false
      }

      var count = SharedPrefs.shared.getNumber(BadgeType.messages.toKeyName()) ?? 0
      count += 1

      SharedPrefs.shared.addToSet(INCREMENTED_FOR_KEY, convoId)
      SharedPrefs.shared.setValue(BadgeType.messages.toKeyName(), count)
      return true
    }

    AsyncFunction("maybeDecrementMessagesCountAsync") { (convoId: String) in
      guard SharedPrefs.shared.setContains(INCREMENTED_FOR_KEY, convoId) else {
        return false
      }

      var count = SharedPrefs.shared.getNumber(BadgeType.messages.toKeyName()) ?? 0
      count -= 1

      SharedPrefs.shared.removeFromSet(INCREMENTED_FOR_KEY, convoId)
      SharedPrefs.shared.setValue(BadgeType.messages.toKeyName(), count)
      return true
    }
  }
}

enum BadgeType: String, Enumerable {
  case generic
  case messages

  func toKeyName() -> String {
    switch self {
    case .generic:
      return "badgeCountGeneric"
    case .messages:
      return "badgeCountMessages"
    }
  }
}
