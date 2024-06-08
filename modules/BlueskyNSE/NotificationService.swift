import UserNotifications
import UIKit

let APP_GROUP = "group.app.bsky"

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
    case NotificationType.Like, NotificationType.Repost, NotificationType.Follow, NotificationType.Reply, NotificationType.Quote:
      mutateWithBadge(bestAttempt, badgeType: BadgeType.Generic, operation: BadgeOperation.Increment)

    case NotificationType.ChatMessage:
      mutateWithChatMessage(bestAttempt)

    case NotificationType.MarkReadGeneric:
      mutateWithBadge(bestAttempt, badgeType: BadgeType.Generic, operation: BadgeOperation.Decrement)

    case NotificationType.MarkReadMessages:
      mutateWithBadge(bestAttempt, badgeType: BadgeType.Messages, operation: BadgeOperation.Decrement)
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

    if type == BadgeType.Generic {
      if operation == BadgeOperation.Decrement {
        if let decrementBy = content.userInfo["decrementBy"] as? Int {
          genericCount = getDecrementedBadgeCount(current: genericCount, decrementBy: decrementBy)
        } else {
          genericCount = 0
        }
      } else {
        genericCount += 1
      }
      prefs?.setValue(genericCount, forKey: BadgeType.Generic.rawValue)
    } else if type == BadgeType.Messages {
      if operation == BadgeOperation.Decrement {
        if let decrementBy = content.userInfo["decrementBy"] as? Int {
          messagesCount = getDecrementedBadgeCount(current: messagesCount, decrementBy: decrementBy)
        } else {
          messagesCount = getDecrementedBadgeCount(current: messagesCount, decrementBy: 1)
        }
      } else {
        genericCount += 1
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
}
