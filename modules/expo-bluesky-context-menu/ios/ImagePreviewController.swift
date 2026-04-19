import UIKit

/// Preview view controller shown during a peek. Renders a single image sized
/// to the provided aspect ratio, capped to the screen bounds.
///
/// The aspect ratio drives `preferredContentSize` so iOS animates directly to
/// the final size without the mid-flight stretch that happens when a mis-sized
/// snapshot is scaled up.
final class ImagePreviewController: UIViewController {
  private let imageURL: URL?
  private let aspectRatio: CGFloat

  init(imageURL: URL?, aspectRatio: CGFloat) {
    self.imageURL = imageURL
    self.aspectRatio = aspectRatio.isFinite && aspectRatio > 0 ? aspectRatio : 1
    super.init(nibName: nil, bundle: nil)
    self.preferredContentSize = Self.sizeForAspect(self.aspectRatio)
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) not supported") }

  override func loadView() {
    let root = UIView()
    root.backgroundColor = .black
    root.clipsToBounds = true

    let imageView = UIImageView()
    imageView.contentMode = .scaleAspectFit
    imageView.translatesAutoresizingMaskIntoConstraints = false
    imageView.backgroundColor = .black
    root.addSubview(imageView)

    NSLayoutConstraint.activate([
      imageView.leadingAnchor.constraint(equalTo: root.leadingAnchor),
      imageView.trailingAnchor.constraint(equalTo: root.trailingAnchor),
      imageView.topAnchor.constraint(equalTo: root.topAnchor),
      imageView.bottomAnchor.constraint(equalTo: root.bottomAnchor),
    ])

    self.view = root
    load(into: imageView)
  }

  private func load(into imageView: UIImageView) {
    guard let url = imageURL else { return }
    // Use URLSession + URLCache so we cooperate with Expo Image's HTTP cache.
    let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 10)
    if let cached = URLCache.shared.cachedResponse(for: request),
       let image = UIImage(data: cached.data) {
      imageView.image = image
      return
    }
    URLSession.shared.dataTask(with: request) { [weak imageView] data, _, _ in
      guard let data = data, let image = UIImage(data: data) else { return }
      DispatchQueue.main.async { imageView?.image = image }
    }.resume()
  }

  /// Caps the preview to a comfortable size within the current key window.
  private static func sizeForAspect(_ aspect: CGFloat) -> CGSize {
    let screen = UIScreen.main.bounds
    let maxW = screen.width - 32
    let maxH = screen.height * 0.7
    var w = maxW
    var h = w / aspect
    if h > maxH {
      h = maxH
      w = h * aspect
    }
    return CGSize(width: w, height: h)
  }
}
