import UserNotifications
import UIKit

let APP_GROUP = "group.app.bsky"
typealias ContentHandler = (UNNotificationContent) -> Void

enum NotificationType: String, CaseIterable  {
  case like
  case repost
  case follow
  case reply
  case quote
  case chatMessage = "chat-message"
  case markReadGeneric = "mark-read-generic"
  case markReadMessages = "mark-read-messages"
  case starterPackJoined = "starterpack-joined"
}

enum BadgeType: String, CaseIterable {
  case generic
  case messages
}

enum BadgeOperation {
  case increment
  case decrement
}

let INCREMENTED_FOR_KEY = "incremented-for-convos"

// This extension allows us to do some processing of the received notification
// data before displaying the notification to the user. In our use case, there
// are a few particular things that we want to do:
//
// - Determine whether we should play a sound for the notification
// - Download and display any images for the notification
// - Update the badge count accordingly
//
// The extension may or may not create a new process to handle a notification.
// It is also possible that multiple notifications will be processed by the
// same instance of `NotificationService`, though these will happen in
// parallel.
//
// Because multiple instances of `NotificationService` may exist, we should
// be careful in accessing preferences that will be mutated _by the
// extension itself_. For example, we should not worry about `playChatSound`
// changing, since we never mutate that value within the extension itself.
// However, since we mutate `badgeCount` frequently, we should ensure that
// these updates always run sync with each other and that the have access
// to the most recent values.

class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ContentHandler?
  private var bestAttempt: UNMutableNotificationContent?

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {

    guard let bestAttempt = NSEUtil.createCopy(request.content),
          let reasonString = request.content.userInfo["reason"] as? String,
          let reason = NotificationType(rawValue: reasonString)
    else {
      contentHandler(request.content)
      return
    }
    
    self.contentHandler = contentHandler
    self.bestAttempt = bestAttempt
    
    NSEUtil.shared.prefsQueue.sync {
      switch reason {
      case .like, .repost, .follow, .reply, .quote, .starterPackJoined:
        NSEUtil.mutateWithBadge(bestAttempt, badgeType: .generic, operation: .increment)
      case .chatMessage:
        NSEUtil.mutateWithChatMessage(bestAttempt)
        NSEUtil.mutateWithBadge(bestAttempt, badgeType: .messages, operation: .increment)
      case .markReadGeneric:
        NSEUtil.mutateWithBadge(bestAttempt, badgeType: .generic, operation: .decrement)
      case .markReadMessages:
        NSEUtil.mutateWithBadge(bestAttempt, badgeType: .messages, operation: .decrement)
      }
      contentHandler(bestAttempt)
    }
  }

  override func serviceExtensionTimeWillExpire() {
    guard let contentHandler = self.contentHandler,
          let bestAttempt = self.bestAttempt else {
      return
    }
    contentHandler(bestAttempt)
  }
}

// NSEUtil's purpose is to create a shared instance of `UserDefaults` across
// `NotificationService` instances. It also includes a queue so that we can process
// updates to `UserDefaults` in parallel.
//
// Any time that you increment or decrement counts for notifications, you should use
// the prefsQueue so that things remain in sync.

private class NSEUtil {
  static let shared = NSEUtil()

  var prefs = UserDefaults(suiteName: APP_GROUP)
  var prefsQueue = DispatchQueue(label: "NSEPrefsQueue")

  // MARK: - Utils
  
  static func createCopy(_ content: UNNotificationContent) -> UNMutableNotificationContent? {
    return content.mutableCopy() as? UNMutableNotificationContent
  }
  
  static func getDecrementedBadgeCount(current: Int, decrementBy by: Int) -> Int {
    let new = current - by
    if new < 0 {
      return 0
    }
    return new
  }
  
  // MARK: - Mutations
  
  static func mutateWithBadge(_ content: UNMutableNotificationContent,
                       badgeType type: BadgeType,
                       operation: BadgeOperation) {
    var genericCount = Self.shared.prefs?.integer(forKey: BadgeType.generic.rawValue) ?? 0
    var messagesCount = Self.shared.prefs?.integer(forKey: BadgeType.messages.rawValue) ?? 0
    
    if type == .generic {
      if operation == .decrement {
        genericCount = 0
      } else {
        genericCount += 1
      }
      Self.shared.prefs?.setValue(genericCount, forKey: BadgeType.generic.rawValue)
      // TEMPORARY - since we have not implemented message count clearing on the server, we'll clear
      // those here as well.
      Self.shared.prefs?.setValue(messagesCount, forKey: BadgeType.messages.rawValue)
    } else if type == .messages {
      // Not yet implemented, but here's the logic
      if operation == .decrement,
         Self.shouldDecrementForConvo(content) {
        messagesCount = Self.getDecrementedBadgeCount(current: messagesCount, decrementBy: 1)
      } else if operation == .increment,
                shouldIncrementForConvo(content) {
        messagesCount += 1
      }
    }
  }
  
  static func mutateWithChatMessage(_ content: UNMutableNotificationContent) {
    if Self.shared.prefs?.bool(forKey: "playSoundChat") == true {
      Self.mutateWithDmSound(content)
    }
  }
  
  static func mutateWithDefaultSound(_ content: UNMutableNotificationContent) {
    content.sound = UNNotificationSound.default
  }
  
  static func mutateWithDmSound(_ content: UNMutableNotificationContent) {
    content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: "dm.aiff"))
  }
  
  static func shouldIncrementForConvo(_ content: UNMutableNotificationContent) -> Bool {
    guard let convoId = content.userInfo["convoId"] as? String,
          var dict = Self.shared.prefs?.dictionary(forKey: INCREMENTED_FOR_KEY) as? [String: Bool] else {
      return false
    }
    
    if dict["convoId"] == true {
      return false
    }
    
    dict[convoId] = true
    Self.shared.prefs?.set(dict, forKey: INCREMENTED_FOR_KEY)
    return true
  }
  
  static func shouldDecrementForConvo(_ content: UNMutableNotificationContent) -> Bool {
    guard let convoId = content.userInfo["convoId"] as? String,
          var dict = Self.shared.prefs?.dictionary(forKey: INCREMENTED_FOR_KEY) as? [String: Bool] else {
      return false
    }
    
    if dict["convoId"] != true {
      return false
    }
    
    dict.removeValue(forKey: convoId)
    Self.shared.prefs?.set(dict, forKey: INCREMENTED_FOR_KEY)
    return true
  }
}
