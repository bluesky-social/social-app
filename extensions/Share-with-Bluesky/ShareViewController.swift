import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
  let appScheme = Bundle.main.object(forInfoDictionaryKey: "MainAppScheme") as? String ?? "bluesky"

  // Don't freeze
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)

    // If there are not any items, we are not going to do anything here
    guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
          let attachments = extensionItem.attachments,
          let firstAttachment = extensionItem.attachments?.first
    else {
      self.completeRequest()
      return
    }

    Task {
      // Check the items and see what the type is
      if firstAttachment.hasItemConformingToTypeIdentifier("public.text") {
        await self.handleText(item: firstAttachment)
      } else if firstAttachment.hasItemConformingToTypeIdentifier("public.url") {
        await self.handleUrl(item: firstAttachment)
      } else if firstAttachment.hasItemConformingToTypeIdentifier("public.image") {
        await self.handleImages(items: attachments)
      } else {
        self.completeRequest()
      }
    }
  }

  private func handleText(item: NSItemProvider) async -> Void {
    // Load the text
    do {
      if let data = try await item.loadItem(forTypeIdentifier: "public.text") as? String {
        // Try to get the text
        if let encoded = data.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
           let url = URL(string: "\(self.appScheme)://?compose=true&text=\(encoded)")
        {
          // Open bluesky
          _ = self.openURL(url)
        }
      }
      self.completeRequest()
    } catch {
      self.completeRequest()
    }
  }

  private func handleUrl(item: NSItemProvider) async -> Void {
    do {
      if let data = try await item.loadItem(forTypeIdentifier: "public.url") as? URL {
        // Get the url and open bluesky
        if let encoded = data.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
           let url = URL(string: "\(self.appScheme)://?compose=true&text=\(encoded)")
        {
          // open bluesky
          _ = self.openURL(url)
        }
      }
      self.completeRequest()
    } catch {
      self.completeRequest()
    }
  }

  private func handleImages(items: [NSItemProvider]) async -> Void {
    // Verify that they are all images and that there are not more than four, just in case
    guard items.count <= 4 else {
      self.completeRequest()
      return
    }

    // Check them all
    var valid = true
    items.forEach { item in
      if !item.hasItemConformingToTypeIdentifier("public.image") {
        valid = false
      }
    }
    if !valid {
      self.completeRequest()
      return
    }

    // Build a string
    var imageUris = ""

    for (index, item) in items.enumerated() {
      do {
        if let data = try await item.loadItem(forTypeIdentifier: "public.image") as? URL {
          // Now we need to duplicate this image, since we don't have access to the outgoing temp directory
          // We also will get the image dimensions here, sinze RN makes it difficult to get those dimensions for local files
          let ext = data.absoluteString.split(separator: ".").last ?? "jpeg" // Keep swift happy
          let data = try Data(contentsOf: data)
          let image = UIImage(data: data)

          if let dir = FileManager()
            .containerURL(
              forSecurityApplicationGroupIdentifier: "group.\(Bundle.main.bundleIdentifier?.replacingOccurrences(of: ".Share-with-Bluesky", with: "") ?? "")"),
             let image = image
          {
            let filePath = "\(dir.absoluteString)\(ProcessInfo.processInfo.globallyUniqueString).\(ext)"
            if let newUri = URL(string: filePath) {
              // Write the data
              try data.write(to: newUri)
              imageUris.append("\(newUri.absoluteString)|\(image.size.width)|\(image.size.height)")
            }
          }

          if index < items.count - 1 {
            imageUris.append(",")
          }
        }
      } catch {
        valid = false
      }
    }

    if valid,
       let encoded = imageUris.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
       let url = URL(string: "\(self.appScheme)://?compose=true&imageUris=\(encoded)")
    {
      _ = openURL(url)
    }

    self.completeRequest()
  }

  private func completeRequest() -> Void {
    self.extensionContext?.completeRequest(returningItems: nil)
  }

  @objc func openURL(_ url: URL) -> Bool {
      var responder: UIResponder? = self
      while responder != nil {
          if let application = responder as? UIApplication {
              return application.perform(#selector(openURL(_:)), with: url) != nil
          }
          responder = responder?.next
      }
      return false
  }
}
