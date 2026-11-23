import ExpoModulesCore
import UIKit

/**
 * Shares images to Instagram Stories, opening the story composer with them
 * filled in. See https://developers.facebook.com/docs/instagram-platform/sharing-to-stories
 */
public class ExpoBlueskyInstagramStoryModule: Module {
  private static let shareUrl = "instagram-stories://share"

  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyInstagramStory")

    /*
     * Whether Instagram is installed and can take a story. The scheme must be
     * in LSApplicationQueriesSchemes, or this is always false.
     */
    AsyncFunction("isAvailable") { () -> Bool in
      guard let url = URL(string: Self.shareUrl) else { return false }
      return UIApplication.shared.canOpenURL(url)
    }.runOnQueue(.main)

    AsyncFunction("share") { (options: InstagramStoryOptions, promise: Promise) in
      guard
        let url = URL(
          string: "\(Self.shareUrl)?source_application=\(options.appId)"
        ),
        UIApplication.shared.canOpenURL(url)
      else {
        promise.reject("E_NOT_INSTALLED", "Instagram can't take a story")
        return
      }

      var item: [String: Any] = [:]
      do {
        if let background = options.backgroundImage {
          item["com.instagram.sharedSticker.backgroundImage"] = try readFile(background)
        }
        if let sticker = options.stickerImage {
          item["com.instagram.sharedSticker.stickerImage"] = try readFile(sticker)
        }
      } catch {
        promise.reject("E_READ_FAILED", "Couldn't read the image: \(error.localizedDescription)")
        return
      }
      if let top = options.backgroundTopColor {
        item["com.instagram.sharedSticker.backgroundTopColor"] = top
      }
      if let bottom = options.backgroundBottomColor {
        item["com.instagram.sharedSticker.backgroundBottomColor"] = bottom
      }

      /*
       * Instagram reads these when it opens. Expire them so they don't linger,
       * and keep them off the user's other devices' clipboards.
       */
      UIPasteboard.general.setItems(
        [item],
        options: [
          .expirationDate: Date().addingTimeInterval(60 * 5),
          .localOnly: true,
        ]
      )

      UIApplication.shared.open(url, options: [:]) { opened in
        if opened {
          promise.resolve(nil)
        } else {
          promise.reject("E_OPEN_FAILED", "Couldn't open Instagram")
        }
      }
    }.runOnQueue(.main)
  }

  /** Reads a local file, given as a `file://` URI or a plain path. */
  private func readFile(_ uriOrPath: String) throws -> Data {
    let url =
      uriOrPath.hasPrefix("file://")
      ? URL(string: uriOrPath) ?? URL(fileURLWithPath: uriOrPath)
      : URL(fileURLWithPath: uriOrPath)
    return try Data(contentsOf: url)
  }
}

struct InstagramStoryOptions: Record {
  /** The Facebook App ID. Instagram rejects stories without a registered one. */
  @Field var appId: String = ""
  /** A full-screen image, 9:16. */
  @Field var backgroundImage: String?
  /** An image laid over the background, which the person can move and resize. */
  @Field var stickerImage: String?
  /** Hex colors for a gradient behind the sticker, when there's no background. */
  @Field var backgroundTopColor: String?
  @Field var backgroundBottomColor: String?
}
