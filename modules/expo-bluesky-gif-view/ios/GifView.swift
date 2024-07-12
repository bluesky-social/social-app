import ExpoModulesCore
import SDWebImage
import SDWebImageWebPCoder

typealias SDWebImageContext = [SDWebImageContextOption: Any]

public class GifView: ExpoView, AVPlayerViewControllerDelegate {
  // Events
  private let onPlayerStateChange = EventDispatcher()

  // SDWebImage
  private let imageView = SDAnimatedImageView(frame: .zero)
  private let imageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )
  private var isPlaying = true
  private var isLoaded = false

  // Requests
  private var webpOperation: SDWebImageCombinedOperation?
  private var placeholderOperation: SDWebImageCombinedOperation?

  // Props
  var source: String?
  var placeholderSource: String?
  var autoplay = true {
    didSet {
      if !autoplay {
        self.pause()
      } else {
        self.play()
      }
    }
  }

  // MARK: - Lifecycle

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.clipsToBounds = true

    self.imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    self.imageView.layer.masksToBounds = false
    self.imageView.backgroundColor = .clear
    self.imageView.contentMode = .scaleToFill

    // We have to explicitly set this to false. If we don't, every time
    // the view comes into the viewport, it will start animating again
    self.imageView.autoPlayAnimatedImage = false

    self.addSubview(self.imageView)
  }

  public override func willMove(toWindow newWindow: UIWindow?) {
    if newWindow == nil {
      // Don't cancel the placeholder operation, because we really want that to complete for
      // when we scroll back up
      self.webpOperation?.cancel()
      self.placeholderOperation?.cancel()
    } else if self.imageView.image == nil {
      self.load()
    }
  }

  // MARK: - Loading

  private func load() {
    guard let source = self.source, let placeholderSource = self.placeholderSource else {
      return
    }

    self.webpOperation?.cancel()
    self.placeholderOperation?.cancel()

    // We only need to start an operation for the placeholder if it doesn't exist
    // in the cache already. Cache key is by default the absolute URL of the image.
    // See:
    // https://github.com/SDWebImage/SDWebImage/blob/master/Docs/HowToUse.md#using-asynchronous-image-caching-independently
    if !SDImageCache.shared.diskImageDataExists(withKey: source),
       let url = URL(string: placeholderSource) {
      self.placeholderOperation = imageManager.loadImage(
        with: url,
        options: [.retryFailed],
        context: Util.createContext(),
        progress: onProgress(_:_:_:),
        completed: onLoaded(_:_:_:_:_:_:)
      )
    }

    if let url = URL(string: source) {
      self.webpOperation = imageManager.loadImage(
        with: url,
        options: [.retryFailed],
        context: Util.createContext(),
        progress: onProgress(_:_:_:),
        completed: onLoaded(_:_:_:_:_:_:)
      )
    }
  }

  private func setImage(_ image: UIImage) {
    if self.imageView.image == nil || image.sd_isAnimated {
      self.imageView.image = image
    }

    if image.sd_isAnimated {
      self.firePlayerStateChange()
      if isPlaying {
        self.imageView.startAnimating()
      }
    }
  }

  // MARK: - Loading blocks

  private func onProgress(_ receivedSize: Int, _ expectedSize: Int, _ imageUrl: URL?) {}

  private func onLoaded(
    _ image: UIImage?,
    _ data: Data?,
    _ error: Error?,
    _ cacheType: SDImageCacheType,
    _ finished: Bool,
    _ imageUrl: URL?
  ) {
    guard finished else {
      return
    }

    if let placeholderSource = self.placeholderSource,
       imageUrl?.absoluteString == placeholderSource,
       self.imageView.image == nil,
       let image = image {
      self.setImage(image)
      return
    }

    if let source = self.source,
       imageUrl?.absoluteString == source,
       // UIImage perf suckssss if the image is animated
       let data = data,
       let animatedImage = SDAnimatedImage(data: data) {
      self.placeholderOperation?.cancel()
      self.isPlaying = self.autoplay
      self.isLoaded = true
      self.setImage(animatedImage)
      self.firePlayerStateChange()
    }
  }

  // MARK: - Playback Controls

  func play() {
    self.imageView.startAnimating()
    self.isPlaying = true
    self.firePlayerStateChange()
  }

  func pause() {
    self.imageView.stopAnimating()
    self.isPlaying = false
    self.firePlayerStateChange()
  }

  func toggle() {
    if self.isPlaying {
      self.pause()
    } else {
      self.play()
    }
  }

  // MARK: - Util

  private func firePlayerStateChange() {
    onPlayerStateChange([
      "isPlaying": self.isPlaying,
      "isLoaded": self.isLoaded
    ])
  }
}
