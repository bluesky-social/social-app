import UserNotifications
import UIKit
import Intents
import os.log

let APP_GROUP = "group.app.bsky"
typealias ContentHandler = (UNNotificationContent) -> Void

// Debug logging. Filter in Console.app with `subsystem:app.bsky.NSE`.
private let nseLog = OSLog(subsystem: "app.bsky.NSE", category: "GroupChat")

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

    let userInfo = request.content.userInfo
    os_log(
      "didReceive reason=%{public}@ convoKind=%{public}@ convoGroupName=%{public}@ convoAvatarUrl=%{public}@ messageKind=%{public}@ senderDisplayName=%{public}@ keys=%{public}@",
      log: nseLog,
      type: .info,
      String(describing: userInfo["reason"]),
      String(describing: userInfo["convoKind"]),
      String(describing: userInfo["convoGroupName"]),
      String(describing: userInfo["convoAvatarUrl"]),
      String(describing: userInfo["messageKind"]),
      String(describing: userInfo["senderDisplayName"]),
      String(describing: userInfo.keys.compactMap { $0 as? String }.sorted())
    )

    guard let bestAttempt = NSEUtil.createCopy(request.content),
          let reason = request.content.userInfo["reason"] as? String
    else {
      os_log("Bailing early: missing copy or reason", log: nseLog, type: .error)
      contentHandler(request.content)
      return
    }

    self.bestAttempt = bestAttempt

    if reason == "chat-message" || reason == "chat-reaction" {
      mutateWithChatMessage(bestAttempt)
      // Only apply the title->body swap for chat-message. For chat-reaction,
      // `messageKind` refers to the reacted-to message, so we'd clobber the
      // descriptive reaction body with the title for reactions on system
      // messages.
      if reason == "chat-message" {
        mutateChatMessageBody(bestAttempt, userInfo: request.content.userInfo)
      }
      mutateWithGroupSubtitle(bestAttempt, userInfo: request.content.userInfo)
      let finalContent = createCommunicationNotification(
        from: bestAttempt,
        userInfo: request.content.userInfo
      )
      os_log(
        "Delivering chat content title=%{public}@ subtitle=%{public}@ body=%{public}@",
        log: nseLog,
        type: .info,
        finalContent.title,
        finalContent.subtitle,
        finalContent.body
      )
      contentHandler(finalContent)
    } else if reason == "chat-added-to-group"
                || reason == "chat-removed-from-group"
                || reason == "chat-join-request-rejected" {
      mutateWithChatMessage(bestAttempt)
      mutateWithGroupSubtitle(bestAttempt, userInfo: request.content.userInfo)
      mutateWithBadge(bestAttempt)
      os_log(
        "Delivering group-event content title=%{public}@ subtitle=%{public}@ body=%{public}@",
        log: nseLog,
        type: .info,
        bestAttempt.title,
        bestAttempt.subtitle,
        bestAttempt.body
      )
      contentHandler(bestAttempt)
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

    var speakableGroupName: INSpeakableString? = nil
    let convoKind = userInfo["convoKind"] as? String
    let rawGroupName = userInfo["convoGroupName"]
    if convoKind == "group",
       let groupName = rawGroupName as? String,
       !groupName.isEmpty {
      speakableGroupName = INSpeakableString(spokenPhrase: groupName)
      os_log(
        "createCommunicationNotification: speakableGroupName set to %{public}@",
        log: nseLog,
        type: .info,
        groupName
      )
    } else {
      os_log(
        "createCommunicationNotification: speakableGroupName NOT set (convoKind=%{public}@, rawGroupName=%{public}@, type=%{public}@)",
        log: nseLog,
        type: .info,
        String(describing: convoKind),
        String(describing: rawGroupName),
        String(describing: type(of: rawGroupName as Any))
      )
    }

    let intent = INSendMessageIntent(
      recipients: nil,
      outgoingMessageType: .outgoingMessageText,
      content: content.body,
      speakableGroupName: speakableGroupName,
      conversationIdentifier: convoId,
      serviceName: nil,
      sender: sender,
      attachments: nil
    )

    // For group convos, attach the composite group avatar (rendered by the
    // ogcard service) to the `speakableGroupName` parameter so iOS shows it
    // alongside the sender on the Communication Notification.
    if userInfo["convoKind"] as? String == "group",
       let convoAvatarUrlString = userInfo["convoAvatarUrl"] as? String,
       let groupImage = downloadAvatarImage(from: convoAvatarUrlString) {
      intent.setImage(groupImage, forParameterNamed: \.speakableGroupName)
    }

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

  // For group convos, surface the group name as the notification subtitle.
  // The sender's display name is shown as the title (overridden by
  // `INSendMessageIntent` for chat-message/chat-reaction).
  func mutateWithGroupSubtitle(
    _ content: UNMutableNotificationContent,
    userInfo: [AnyHashable: Any]
  ) {
    let convoKind = userInfo["convoKind"] as? String
    let rawGroupName = userInfo["convoGroupName"]
    guard convoKind == "group",
          let groupName = rawGroupName as? String,
          !groupName.isEmpty else {
      os_log(
        "mutateWithGroupSubtitle: skipped (convoKind=%{public}@, rawGroupName=%{public}@)",
        log: nseLog,
        type: .info,
        String(describing: convoKind),
        String(describing: rawGroupName)
      )
      return
    }
    os_log(
      "mutateWithGroupSubtitle: setting subtitle to %{public}@",
      log: nseLog,
      type: .info,
      groupName
    )
    content.subtitle = groupName
  }

  // System messages (`add_member`, `convo_locked`, `edit_group`, etc.) are
  // delivered through `chat-message` but have a server-rendered description
  // in `title`. iOS overrides the title with the sender name once we apply
  // `INSendMessageIntent`, so we move the title text into the body before
  // building the intent.
  func mutateChatMessageBody(
    _ content: UNMutableNotificationContent,
    userInfo: [AnyHashable: Any]
  ) {
    guard let messageKind = userInfo["messageKind"] as? String,
          messageKind != "message",
          !content.title.isEmpty else {
      return
    }
    content.body = content.title
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
