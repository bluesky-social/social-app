import Foundation
import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    
    guard var bestAttempt = createCopy(request.content),
          let reason = request.content.userInfo["reason"] as? String
    else {
      return
    }
    
    if reason == "chat-message" {
      bestAttempt = mutateWithChatMessage(bestAttempt)
    }
    
    // Always increment the badge
    bestAttempt = mutateWithBadge(bestAttempt)
    
    contentHandler(bestAttempt)
  }
  
  // If for some reason the alloted time expires, we don't actually want to display a notification
  override func serviceExtensionTimeWillExpire() {
    if let contentHandler = contentHandler {
      contentHandler(UNNotificationContent())
    }
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


