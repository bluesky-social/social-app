import ExpoModulesCore
import ExpoBlueskySwissArmy

let APP_GROUP = "group.app.bsky"

let DEFAULTS: [String:Any] = [
  "playSoundChat" : true,
  "playSoundFollow": false,
  "playSoundLike": false,
  "playSoundMention": false,
  "playSoundQuote": false,
  "playSoundReply": false,
  "playSoundRepost": false,
  "mutedThreads": [:] as! [String:[String]],
  "badgeCount": 0,
]

/*
 * The purpose of this module is to store values that are needed by the notification service
 * extension. Since we would rather get and store values such as age or user mute state
 * while the app is foregrounded, we should use this module liberally. We should aim to keep
 * background fetches to a minimum (two or three times per hour) while the app is backgrounded
 * or killed
 */
public class ExpoBackgroundNotificationHandlerModule: Module {
  let userDefaults = UserDefaults(suiteName: APP_GROUP)
  
  func test() {
    SharedPrefs
  }
  
  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundNotificationHandler")
    
    OnCreate {
      DEFAULTS.forEach { p in
        if userDefaults?.value(forKey: p.key) == nil {
          userDefaults?.setValue(p.value, forKey: p.key)
        }
      }
    }
    
    AsyncFunction("setBadgeCountAsync") { (type: BadgeType, count: Int) in
      userDefaults?.setValue(count, forKey: type.toKeyName())
    }
  }
}

enum BadgeType : String, Enumerable {
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
