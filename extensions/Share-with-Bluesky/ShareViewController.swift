import UIKit

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
    let firstFourItems: [NSItemProvider]
    if items.count < 4 {
      firstFourItems = items
    } else {
      firstFourItems = Array(items[0...3])
    }

    var valid = true
    // Build a string
    var imageUris = ""

    for (index, item) in firstFourItems.enumerated() {
      var imageUriInfo: String? = nil

      do {
        if let dataUri = try await item.loadItem(forTypeIdentifier: "public.image") as? URL {
          // Now we need to duplicate this image, since we don't have access to the outgoing temp directory
          // We also will get the image dimensions here, sinze RN makes it difficult to get those dimensions for local files
          let data = try Data(contentsOf: dataUri)
          let image = UIImage(data: data)
          imageUriInfo = saveImageWithInfo(image)
        } else if let image = try await item.loadItem(forTypeIdentifier: "public.image") as? UIImage {
          imageUriInfo = saveImageWithInfo(image)
        }
      } catch {
        valid = false
      }

      // If we got data back, add it on
      if let imageUriInfo = imageUriInfo {
        imageUris.append(imageUriInfo)
        if index < items.count - 1 {
          imageUris.append(",")
        }
      } else {
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

  private func saveImageWithInfo(_ image: UIImage?) -> String? {
    guard let image = image else {
      return nil
    }

    do {
      // Try to get the app group directory
      if let dir = FileManager()
        .containerURL(
          forSecurityApplicationGroupIdentifier: "group.\(Bundle.main.bundleIdentifier?.replacingOccurrences(of: ".Share-with-Bluesky", with: "") ?? "")")
      {
        // Create the filepath
        let filePath = "\(dir.absoluteString)\(ProcessInfo.processInfo.globallyUniqueString).jpeg"

        // Try to create a new URI and create the JPEG data
        if let newUri = URL(string: filePath),
           let jpegData = image.jpegData(compressionQuality: 1)
        {
          // Write the data and return the info
          try jpegData.write(to: newUri)
          return "\(newUri.absoluteString)|\(image.size.width)|\(image.size.height)"
        }
      }
    } catch {
      return nil
    }

    return nil
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
