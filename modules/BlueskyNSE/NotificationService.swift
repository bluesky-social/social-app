import UserNotifications
import UIKit
import Intents

let APP_GROUP = "group.app.bsky"
typealias ContentHandler = (UNNotificationContent) -> Void
typealias ImageDownloadTaskCompletion = (UIImage?) -> Void

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

    guard let bestAttempt = NSEUtil.createCopy(request.content) else {
      contentHandler(request.content)
      return
    }

    self.bestAttempt = bestAttempt

    if isReasonDm() {

    }

    if isReasonDm() {
      mutateWithChatMessage(bestAttempt)
      mutateWithAvatar(bestAttempt) {
        contentHandler(bestAttempt)
      }
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

    if isReasonDm(),
       let subject = self.getSubject() {
      NSEUtil.shared.cancelImageDownload(userId: subject)
    }

    contentHandler(bestAttempt)
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

  func mutateWithAvatar(_ content: UNMutableNotificationContent, completion: @escaping () -> Void) {
    // Here, the server will only give us an avatar uri if there is a
    // follow relationship. All we need to check is the preference.
    guard NSEUtil.shared.prefs?.bool(forKey: "showAvatarDms") == true,
          #available (iOSApplicationExtension 15.0, *),
          let avatarUrlString = content.userInfo["senderAvatarUrl"] as? String,
          // TODO - uncomment once added to chat service
          // let displayName = content.userInfo["senderDisplayName"] as? String,
          let avatarUrl = URL(string: avatarUrlString),
          let subject = self.getSubject(),
          let contentHandler = self.contentHandler else {
      completion()
      return
    }

    NSEUtil.shared.downloadImageIfNecessary(avatarUrl, userId: subject) { imageUrl in
      guard let imageUrl = imageUrl else {
        completion()
        return
      }

      // TODO - hack, just getting the display name from the title. We'll add this
      // to the chat service and remove the hack later
      let displayName = content.title.components(separatedBy: " to ")[0]
      let handle = INPersonHandle(value: subject,
                                  type: .unknown)
      let image = INImage(url: imageUrl)
      let sender = INPerson(personHandle: handle,
                            nameComponents: nil,
                            displayName: displayName,
                            image: image,
                            contactIdentifier: subject,
                            customIdentifier: nil)
      let intent = INSendMessageIntent.init(recipients: nil,
                                            outgoingMessageType: .outgoingMessageText,
                                            content: content.body,
                                            speakableGroupName: nil,
                                            conversationIdentifier: subject,
                                            serviceName: nil,
                                            sender: sender,
                                            attachments: nil)

      _ = try? content.updating(from: intent)
      completion()
    }
  }

  // MARK: Util

  func isReasonDm() -> Bool {
    guard let reason = self.bestAttempt?.userInfo["reason"] as? String else {
      return false
    }
    return reason == "chat-message"
  }

  func getSubject() -> String? {
    guard let subject = self.bestAttempt?.userInfo["subject"] as? String else {
      return nil
    }
    return subject
  }

  func addPersonAndAvatar(_ content: UNMutableNotificationContent) {
  }
}

// NSEUtil's purpose is to create a shared instance of `UserDefaults` across
// `NotificationService` instances. It also includes a queue so that we can process
// updates to `UserDefaults` in parallel.

private class NSEUtil {
  static let shared = NSEUtil()

  var prefs = UserDefaults(suiteName: APP_GROUP)
  var prefsQueue = DispatchQueue(label: "NSEPrefsQueue")

  // Store each image download task that
  private let imageDownloadTasks = NSMapTable<NSString, ImageDownloadTask>(
    keyOptions: NSPointerFunctions.Options.weakMemory,
    valueOptions: NSPointerFunctions.Options.weakMemory
  )

  // Creates a mutable copy of the provided content
  static func createCopy(_ content: UNNotificationContent) -> UNMutableNotificationContent? {
    return content.mutableCopy() as? UNMutableNotificationContent
  }

  private func createFileURL(userId: String) -> URL? {
    let dir = FileManager.default.temporaryDirectory
    return URL(string: "\(dir.absoluteString)\(userId).png")
  }

  private func imageExists(_ url: URL) -> Bool {
    return FileManager.default.fileExists(atPath: url.absoluteString)
  }

  func downloadImageIfNecessary(_ imageUrl: URL, userId: String, completion: @escaping (URL?) -> Void) {
    guard let outUrl = self.createFileURL(userId: userId) else {
      completion(nil)
      return
    }

    if self.imageExists(outUrl) {
      completion(outUrl)
      return
    }

    let task = ImageDownloadTask(imageUrl: imageUrl) { image in
      guard let image = image,
            let pngData = image.pngData() else {
        completion(nil)
        return
      }
      do {
        try pngData.write(to: outUrl)
        completion(outUrl)
      } catch {
        completion(nil)
      }
    }
    Self.shared.imageDownloadTasks.setObject(task, forKey: NSString(string: userId))
  }

  func cancelImageDownload(userId: String) {
    guard let imageDownloadTask = self.imageDownloadTasks.object(forKey: NSString(string: userId)) else {
      return
    }
    imageDownloadTask.cancel()
  }
}

// A small class that stores multiple completion blocks for a task and will ensure each is called even
// if the task itself is cancelled.

class ImageDownloadTask {
  private var completionBlocks = [ImageDownloadTaskCompletion]()
  private var task: URLSessionDataTask?

  init(imageUrl: URL, completion: @escaping ImageDownloadTaskCompletion) {
    self.completionBlocks.append(completion)
    self.createTask(imageUrl)
  }

  private func createTask(_ imageUrl: URL) {
    let task = URLSession.shared.dataTask(with: imageUrl) { data, _, _ in
      guard let data = data,
            let image = UIImage(data: data) else {
        self.callEachCompletionBlock(nil)
        return
      }
      self.callEachCompletionBlock(image)
    }
    task.resume()
  }

  private func callEachCompletionBlock(_ image: UIImage?) {
    completionBlocks.forEach { completion in
      completion(image)
    }
  }

  func addCompletionBlock(_ completion: @escaping ImageDownloadTaskCompletion) {
    self.completionBlocks.append(completion)
  }

  func cancel() {
    self.task?.cancel()
    self.callEachCompletionBlock(nil)
  }
}

enum DownloadError: Error {
  case unknownError(String)
}
