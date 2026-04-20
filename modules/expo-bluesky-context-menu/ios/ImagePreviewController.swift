import SDWebImage
import UIKit

/// Preview view controller shown during a peek. Renders a single image sized
/// to the provided aspect ratio, capped to the screen bounds.
///
/// The aspect ratio drives `preferredContentSize` so iOS animates directly to
/// the final size without the mid-flight stretch that happens when a mis-sized
/// snapshot is scaled up.
///
/// Image loading cooperates with expo-image by sharing
/// `SDImageCache.shared` and `SDWebImageManager.shared`:
///   1. Query the cache synchronously for the fullsize — if it's there
///      (e.g. prefetched on press-in), paint it immediately.
///   2. Else, paint the thumbnail (almost always cached — it's what the feed
///      renders) as a placeholder.
///   3. Asynchronously load the fullsize and swap it in when it arrives.
/// This eliminates the "black flash" on first peek of an unloaded image.
final class ImagePreviewController: UIViewController {
  private let imageURL: URL?
  private let thumbURL: URL?
  private let aspectRatio: CGFloat

  private let imageView = UIImageView()

  init(imageURL: URL?, thumbURL: URL?, aspectRatio: CGFloat) {
    self.imageURL = imageURL
    self.thumbURL = thumbURL
    self.aspectRatio = aspectRatio.isFinite && aspectRatio > 0 ? aspectRatio : 1
    super.init(nibName: nil, bundle: nil)
    self.preferredContentSize = Self.sizeForAspect(self.aspectRatio)
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) not supported") }

  override func loadView() {
    let root = UIView()
    root.backgroundColor = .black
    root.clipsToBounds = true

    // Use autoresizing mask rather than AutoLayout so the imageView's frame
    // interpolates cleanly during the dismiss animation — AutoLayout-driven
    // relayout during a CALayer animation can cause a visible snap.
    imageView.frame = root.bounds
    imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    imageView.contentMode = .scaleAspectFit
    imageView.backgroundColor = .black
    root.addSubview(imageView)

    self.view = root
    primeImage()
  }

  // MARK: - Image loading

  private func primeImage() {
    // 1. Fullsize cache hit? Paint it immediately.
    if let url = imageURL, let cached = cachedImage(for: url) {
      imageView.image = cached
      return
    }
    // 2. Thumb placeholder (almost always cached by the feed).
    if let thumb = thumbURL, let cached = cachedImage(for: thumb) {
      imageView.image = cached
    }
    // 3. Kick off the async fullsize load.
    guard let url = imageURL else { return }
    SDWebImageManager.shared.loadImage(
      with: url,
      options: [.retryFailed],
      progress: nil
    ) { [weak self] image, _, _, _, _, _ in
      guard let self = self, let image = image else { return }
      DispatchQueue.main.async {
        self.imageView.image = image
      }
    }
  }

  /// Memory-only cache lookup. Disk reads are left to the async SDWebImage
  /// load to avoid blocking the main thread during the peek animation.
  private func cachedImage(for url: URL) -> UIImage? {
    let key = SDWebImageManager.shared.cacheKey(for: url) ?? url.absoluteString
    return SDImageCache.shared.imageFromMemoryCache(forKey: key)
  }

  /// Caps the preview to a comfortable size within the current key window.
  private static func sizeForAspect(_ aspect: CGFloat) -> CGSize {
    let screenBounds = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .first?.screen.bounds ?? UIScreen.main.bounds
    let maxW = screenBounds.width - 32
    let maxH = screenBounds.height * 0.7
    var w = maxW
    var h = w / aspect
    if h > maxH {
      h = maxH
      w = h * aspect
    }
    return CGSize(width: w, height: h)
  }
}
