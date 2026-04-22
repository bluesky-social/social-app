import UserNotifications
import UIKit
import Intents

let APP_GROUP = "group.app.bsky"
typealias ContentHandler = (UNNotificationContent) -> Void

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
    self.contentHandler = contentHandler

    guard let bestAttempt = NSEUtil.createCopy(request.content),
          let reason = request.content.userInfo["reason"] as? String
    else {
      contentHandler(request.content)
      return
    }

    self.bestAttempt = bestAttempt

    if reason == "chat-message" || reason == "chat-reaction" {
      mutateWithChatMessage(bestAttempt)
      let finalContent = createCommunicationNotification(
        from: bestAttempt,
        userInfo: request.content.userInfo
      )
      contentHandler(finalContent)
    } else {
      mutateWithBadge(bestAttempt)
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

  // MARK: Communication Notification

  func createCommunicationNotification(
    from content: UNMutableNotificationContent,
    userInfo: [AnyHashable: Any]
  ) -> UNNotificationContent {
    let senderDisplayName = userInfo["senderDisplayName"] as? String ?? "Unknown"
    let convoId = userInfo["convoId"] as? String
    var avatarImage: INImage? = nil
    if let avatarUrlString = userInfo["senderAvatarUrl"] as? String {
      avatarImage = downloadAvatarImage(from: avatarUrlString)
    }

    let senderHandleValue = userInfo["senderHandle"] as? String
    let senderHandle = INPersonHandle(value: senderHandleValue, type: .unknown)
    let sender = INPerson(
      personHandle: senderHandle,
      nameComponents: nil,
      displayName: senderDisplayName,
      image: avatarImage,
      contactIdentifier: nil,
      customIdentifier: nil
    )

    let intent = INSendMessageIntent(
      recipients: nil,
      outgoingMessageType: .outgoingMessageText,
      content: content.body,
      speakableGroupName: nil,
      conversationIdentifier: convoId,
      serviceName: nil,
      sender: sender,
      attachments: nil
    )

    let interaction = INInteraction(intent: intent, response: nil)
    interaction.direction = .incoming
    interaction.donate(completion: nil)

    do {
      return try content.updating(from: intent)
    } catch {
      return content
    }
  }

  func downloadAvatarImage(from urlString: String) -> INImage? {
    let thumbnailUrlString = urlString.replacingOccurrences(
      of: "/img/avatar/",
      with: "/img/avatar_thumbnail/"
    )

    guard let url = URL(string: thumbnailUrlString) else { return nil }

    var request = URLRequest(url: url)
    request.timeoutInterval = 5

    var imageData: Data? = nil
    let semaphore = DispatchSemaphore(value: 0)

    let task = URLSession.shared.dataTask(with: request) { data, response, error in
      if let data = data,
         let httpResponse = response as? HTTPURLResponse,
         httpResponse.statusCode == 200 {
        imageData = data
      }
      semaphore.signal()
    }
    task.resume()
    semaphore.wait()

    guard let data = imageData else { return nil }
    return INImage(imageData: data)
  }

  // MARK: Mutations

  func mutateWithBadge(_ content: UNMutableNotificationContent) {
    NSEUtil.shared.prefsQueue.sync {
      var count = NSEUtil.shared.prefs?.integer(forKey: "badgeCount") ?? 0
      count += 1

      // Set the new badge number for the notification, then store that value for using later
      content.badge = NSNumber(value: count)
      NSEUtil.shared.prefs?.setValue(count, forKey: "badgeCount")
    }
  }

  func mutateWithChatMessage(_ content: UNMutableNotificationContent) {
    if NSEUtil.shared.prefs?.bool(forKey: "playSoundChat") == true {
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

// NSEUtil's purpose is to create a shared instance of `UserDefaults` across
// `NotificationService` instances. It also includes a queue so that we can process
// updates to `UserDefaults` in parallel.

private class NSEUtil {
  static let shared = NSEUtil()

  var prefs = UserDefaults(suiteName: APP_GROUP)
  var prefsQueue = DispatchQueue(label: "NSEPrefsQueue")

  static func createCopy(_ content: UNNotificationContent) -> UNMutableNotificationContent? {
    return content.mutableCopy() as? UNMutableNotificationContent
  }
}
