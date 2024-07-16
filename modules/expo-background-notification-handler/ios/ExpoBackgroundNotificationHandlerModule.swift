import ExpoModulesCore

let APP_GROUP = "group.app.bsky"

let DEFAULTS: [String: Any] = [
  "playSoundChat": true,
  "playSoundFollow": false,
  "playSoundLike": false,
  "playSoundMention": false,
  "playSoundQuote": false,
  "playSoundReply": false,
  "playSoundRepost": false,
  "mutedThreads": [:] as! [String: [String]],
  "badgeCount": 0
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

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundNotificationHandler")

    OnCreate {
      DEFAULTS.forEach { p in
        if userDefaults?.value(forKey: p.key) == nil {
          userDefaults?.setValue(p.value, forKey: p.key)
        }
      }
    }

    AsyncFunction("getAllPrefsAsync") { () -> [String: Any]? in
      var keys: [String] = []
      DEFAULTS.forEach { p in
        keys.append(p.key)
      }
      return userDefaults?.dictionaryWithValues(forKeys: keys)
    }

    AsyncFunction("getBoolAsync") { (forKey: String) -> Bool in
      if let pref = userDefaults?.bool(forKey: forKey) {
        return pref
      }
      return false
    }

    AsyncFunction("getStringAsync") { (forKey: String) -> String? in
      if let pref = userDefaults?.string(forKey: forKey) {
        return pref
      }
      return nil
    }

    AsyncFunction("getStringArrayAsync") { (forKey: String) -> [String]? in
      if let pref = userDefaults?.stringArray(forKey: forKey) {
        return pref
      }
      return nil
    }

    AsyncFunction("setBoolAsync") { (forKey: String, value: Bool) in
      userDefaults?.setValue(value, forKey: forKey)
    }

    AsyncFunction("setStringAsync") { (forKey: String, value: String) in
      userDefaults?.setValue(value, forKey: forKey)
    }

    AsyncFunction("setStringArrayAsync") { (forKey: String, value: [String]) in
      userDefaults?.setValue(value, forKey: forKey)
    }

    AsyncFunction("addToStringArrayAsync") { (forKey: String, string: String) in
      if var curr = userDefaults?.stringArray(forKey: forKey),
         !curr.contains(string) {
        curr.append(string)
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }

    AsyncFunction("removeFromStringArrayAsync") { (forKey: String, string: String) in
      if var curr = userDefaults?.stringArray(forKey: forKey) {
        curr.removeAll { s in
          return s == string
        }
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }

    AsyncFunction("addManyToStringArrayAsync") { (forKey: String, strings: [String]) in
      if var curr = userDefaults?.stringArray(forKey: forKey) {
        strings.forEach { s in
          if !curr.contains(s) {
            curr.append(s)
          }
        }
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }

    AsyncFunction("removeManyFromStringArrayAsync") { (forKey: String, strings: [String]) in
      if var curr = userDefaults?.stringArray(forKey: forKey) {
        strings.forEach { s in
          curr.removeAll(where: { $0 == s })
        }
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }

    AsyncFunction("setBadgeCountAsync") { (count: Int) in
      userDefaults?.setValue(count, forKey: "badgeCount")
    }
  }
}
