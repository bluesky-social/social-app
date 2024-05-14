import ExpoModulesCore

let APP_GROUP = "group.app.bsky"

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
    
    AsyncFunction("getAllPrefsAsync") { (playSound: Bool) -> [String:Any]? in
      return userDefaults?.dictionaryWithValues(forKeys: [
        "playSoundChat",
        "playSoundOther",
      ])
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
    
    AsyncFunction("setBoolAsync") { (forKey: String, value: Bool) -> Void in
      userDefaults?.setValue(value, forKey: forKey)
    }
    
    AsyncFunction("setBoolAsync") { (forKey: String, value: String) -> Void in
      userDefaults?.setValue(value, forKey: forKey)
    }
  }
  
  func initializePrefs() {
    if userDefaults?.bool(forKey: "initialized") != true {
      let initialPrefs = [
        "playSoundChat" : true,
        "playSoundOther" : false,
      ]
      userDefaults?.setValuesForKeys(initialPrefs)
    }
  }
}
