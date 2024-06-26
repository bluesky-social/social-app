import UserNotifications
import UIKit

let APP_GROUP = "group.app.bsky"
let INCREMENTED_FOR_KEY = "incremented-for-convos"

enum NotificationType: String {
  case Like = "like"
  case Repost = "repost"
  case Follow = "follow"
  case Reply = "reply"
  case Quote = "quote"
  case ChatMessage = "chat-message"
  case MarkReadGeneric = "mark-read-generic"
  case MarkReadMessages = "mark-read-messages"
}

enum BadgeType: String {
  case Generic = "badgeCountGeneric"
  case Messages = "badgeCountMessages"
}

enum BadgeOperation {
  case Increment
  case Decrement
}

class NotificationService: UNNotificationServiceExtension {
  var prefs = UserDefaults(suiteName: APP_GROUP)

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    guard let bestAttempt = createCopy(request.content),
          let reasonString = request.content.userInfo["reason"] as? String,
          let reason = NotificationType(rawValue: reasonString)
    else {
      contentHandler(request.content)
      return
    }

    switch reason {
    case .Like, .Repost, .Follow, .Reply, .Quote:
      mutateWithBadge(bestAttempt, badgeType: .Generic, operation: .Increment)

    case .ChatMessage:
      mutateWithChatMessage(bestAttempt)
      mutateWithBadge(bestAttempt, badgeType: .Messages, operation: .Increment)

    case .MarkReadGeneric:
      mutateWithBadge(bestAttempt, badgeType: .Generic, operation: .Decrement)

    case .MarkReadMessages:
      mutateWithBadge(bestAttempt, badgeType: .Messages, operation: .Decrement)
    }

    contentHandler(bestAttempt)
  }

  override func serviceExtensionTimeWillExpire() {
    // If for some reason the alloted time expires, we don't actually want to display a notification
  }

  func createCopy(_ content: UNNotificationContent) -> UNMutableNotificationContent? {
    return content.mutableCopy() as? UNMutableNotificationContent
  }

  func getDecrementedBadgeCount(current: Int, decrementBy by: Int) -> Int {
    let new = current - by
    if new < 0 {
      return 0
    }
    return new
  }

  func mutateWithBadge(_ content: UNMutableNotificationContent, badgeType type: BadgeType, operation: BadgeOperation) {
    var genericCount = prefs?.integer(forKey: BadgeType.Generic.rawValue) ?? 0
    var messagesCount = prefs?.integer(forKey: BadgeType.Messages.rawValue) ?? 0

    if type == .Generic {
      if operation == .Decrement {
        if let decrementBy = content.userInfo["decrementBy"] as? Int {
          genericCount = getDecrementedBadgeCount(current: genericCount, decrementBy: decrementBy)
        } else {
          genericCount = 0
        }
      } else {
        genericCount += 1
      }
      prefs?.setValue(genericCount, forKey: BadgeType.Generic.rawValue)
    } else if type == .Messages {
      if operation == .Decrement {
        if let convoId = content.userInfo["convoId"] as? String, shouldDecrementForConvo(content) {
          messagesCount = getDecrementedBadgeCount(current: messagesCount, decrementBy: 1)
        } else if let decrementBy = content.userInfo["decrementBy"] as? Int {
          messagesCount = getDecrementedBadgeCount(current: messagesCount, decrementBy: decrementBy)
        }
      } else if shouldIncrementForConvo(content) {
        messagesCount += 1
      }
      prefs?.setValue(messagesCount, forKey: BadgeType.Generic.rawValue)
    }

    content.badge = NSNumber(value: genericCount + messagesCount)
  }

  func mutateWithChatMessage(_ content: UNMutableNotificationContent) {
    if self.prefs?.bool(forKey: "playSoundChat") == true {
      mutateWithDmSound(content)
    }
  }

  func mutateWithDefaultSound(_ content: UNMutableNotificationContent) {
    content.sound = UNNotificationSound.default
  }

  func mutateWithDmSound(_ content: UNMutableNotificationContent) {
    content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: "dm.aiff"))
  }

  func shouldIncrementForConvo(_ content: UNMutableNotificationContent) -> Bool {
    guard let convoId = content.userInfo["convoId"] as? String,
          var dict = self.prefs?.dictionary(forKey: INCREMENTED_FOR_KEY) as? [String: Bool]
    else {
      return false
    }

    if dict["convoId"] == true {
      return false
    }

    dict[convoId] = true
    self.prefs?.set(dict, forKey: INCREMENTED_FOR_KEY)
    return true
  }

  func shouldDecrementForConvo(_ content: UNMutableNotificationContent) -> Bool {
    guard let convoId = content.userInfo["convoId"] as? String,
          var dict = self.prefs?.dictionary(forKey: INCREMENTED_FOR_KEY) as? [String: Bool]
    else {
      return false
    }

    if dict["convoId"] != true {
      return false
    }

    dict.removeValue(forKey: convoId)
    self.prefs?.set(dict, forKey: INCREMENTED_FOR_KEY)
    return true
  }
}
