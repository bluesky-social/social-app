import UserNotifications

let APP_GROUP = "group.app.bsky"

class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    let prefs = NotificationPrefs()
    
    guard var bestAttempt = createCopy(request.content),
          let reason = request.content.userInfo["reason"] as? String
    else {
      return
    }
    
    if reason == "chat-message", prefs.getBool("playSoundChat") == true {
      bestAttempt = mutateWithChatMessage(bestAttempt)
    }
    
    // Always increment the badge
    bestAttempt = mutateWithBadge(bestAttempt)
    
    contentHandler(bestAttempt)
  }
  
  override func serviceExtensionTimeWillExpire() {
    // If for some reason the alloted time expires, we don't actually want to display a notification
  }
  
  func createCopy(_ content: UNNotificationContent) -> UNMutableNotificationContent? {
    return content.mutableCopy() as? UNMutableNotificationContent
  }
  
  func mutateWithChatMessage(_ content: UNMutableNotificationContent) -> UNMutableNotificationContent {
    content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: "blueskydm.wav"))
    return content
  }
  
  func mutateWithBadge(_ content: UNMutableNotificationContent) -> UNMutableNotificationContent {
    content.badge = 1
    return content
  }
}

/**
 * Whenever we add different preferences, they should be added both in the `setValuesForKeys` initializer as well as fetched in
 * `dictionaryWithValues`. This should also be updated inside of `ExpoBackgroundNotificationHandlerModule`.
 */
class NotificationPrefs {
  let userDefaults = UserDefaults(suiteName: APP_GROUP)
  var prefs: [String:Any] = [:]
  
  init() {
    if userDefaults?.bool(forKey: "initialized") != true {
      let initialPrefs = [
        "playSoundChat" : true,
        "playSoundOther" : false,
      ]
      userDefaults?.setValuesForKeys(initialPrefs)
      self.prefs = initialPrefs
    } else {
      if let prefs = userDefaults?.dictionaryWithValues(forKeys: [
        "playSoundChat",
        "playSoundOther",
      ]) {
        self.prefs = prefs
      }
    }
  }
  
  func getString(_ forKey: String) -> String? {
    if let pref = prefs[forKey] as? String {
      return pref
    }
    return nil
  }
  
  func getBool(_ forKey: String) -> Bool {
    if let pref = prefs[forKey] as? Bool {
      return pref
    }
    return false
  }
  
  func setPref(_ forKey: String, value: Any?) {
    userDefaults?.setValue(value, forKey: forKey)
    self.prefs[forKey] = value
  }
}
