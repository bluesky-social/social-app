import UserNotifications

let APP_GROUP = "group.app.bsky"

class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var under18: Bool = true

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    let prefs = NotificationPrefs()
    
    guard var bestAttempt = createCopy(request.content),
          let reason = request.content.userInfo["reason"] as? String
    else {
      return
    }
    
    if reason == "chat-message" {
      if under18 {
        return
      }
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

class NotificationPrefs {
  let userDefaults = UserDefaults(suiteName: APP_GROUP)
  var prefs: [String:Any] = [:]
  
  init() {
    if userDefaults?.bool(forKey: "initialized") != true {
      userDefaults?.setValuesForKeys([
        "playSoundDms" : true,
        "playSoundOther" : false,
      ])
    } else {
      if let prefs = userDefaults?.dictionaryWithValues(forKeys: [
        "playSoundDms",
        "playSoundOther",
      ]) {
        self.prefs = prefs
      }
    }
  }
  
  func getPref(_ forKey: String) -> Any? {
    return prefs[forKey]
  }
  
  func setPref(_ forKey: String, value: Any?) {
    userDefaults?.setValue(value, forKey: forKey)
    self.prefs[forKey] = value
  }
}
