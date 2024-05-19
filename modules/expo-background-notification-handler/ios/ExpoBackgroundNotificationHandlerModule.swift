import ExpoModulesCore

let APP_GROUP = "group.app.bsky"

let DEFAULTS: [String:Any] = [
  "playSoundChat" : true,
  "playSoundFollow": false,
  "playSoundLike": false,
  "playSoundMention": false,
  "playSoundQuote": false,
  "playSoundReply": false,
  "playSoundRepost": false,
  "threadMutes": [:] as [String:Bool],
  "disabledChatDids": [:] as [String:Bool],
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
    
    AsyncFunction("getAllPrefsAsync") { () -> [String:Any]? in
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
    
    AsyncFunction("getStringStoreAsync") { (forKey: String) -> [String:Bool]? in
      if let pref = userDefaults?.dictionary(forKey: forKey) as? [String:Bool] {
        return pref
      }
      return nil
    }
    
    AsyncFunction("setBoolAsync") { (forKey: String, value: Bool) -> Void in
      userDefaults?.setValue(value, forKey: forKey)
    }
    
    AsyncFunction("setStringAsync") { (forKey: String, value: String) -> Void in
      userDefaults?.setValue(value, forKey: forKey)
    }
    
    AsyncFunction("setStringStoreAsync") { (forKey: String, value: [String:Bool]) -> Void in
      userDefaults?.setValue(value, forKey: forKey)
    }
    
    AsyncFunction("addToStringStoreAsync") { (forKey: String, string: String) in
      if var curr = userDefaults?.dictionary(forKey: forKey) as? [String:Bool] {
        curr[string] = true
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }
    
    AsyncFunction("removeFromStringStoreAsync") { (forKey: String, string: String) in
      if var curr = userDefaults?.dictionary(forKey: forKey) as? [String:Bool] {
        curr.removeValue(forKey: string)
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }
    
    AsyncFunction("addManyToStringStoreAsync") { (forKey: String, strings: [String]) in
      if var curr = userDefaults?.dictionary(forKey: forKey) as? [String:Bool] {
        strings.forEach { s in
          curr[s] = true
        }
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }
    
    AsyncFunction("removeManyFromStringStoreAsync") { (forKey: String, strings: [String]) in
      if var curr = userDefaults?.dictionary(forKey: forKey) as? [String:Bool] {
        strings.forEach { s in
          curr.removeValue(forKey: s)
        }
        userDefaults?.setValue(curr, forKey: forKey)
      }
    }
  }
}
