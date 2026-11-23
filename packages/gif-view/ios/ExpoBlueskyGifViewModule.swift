import ExpoModulesCore
import SDWebImage
import SDWebImageWebPCoder

public class ExpoBlueskyGifViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyGifView")

    OnCreate {
      SDImageCodersManager.shared.addCoder(SDImageGIFCoder.shared)
    }

    AsyncFunction("prefetchAsync") { (sources: [URL]) in
      SDWebImagePrefetcher.shared.prefetchURLs(sources, context: Util.createContext(), progress: nil)
    }

    View(GifView.self) {
      Events(
        "onPlayerStateChange"
      )

      Prop("source") { (view: GifView, prop: String) in
        view.source = prop
      }

      Prop("placeholderSource") { (view: GifView, prop: String) in
        view.placeholderSource = prop
      }

      Prop("autoplay") { (view: GifView, prop: Bool) in
        view.autoplay = prop
      }

      AsyncFunction("toggleAsync") { (view: GifView) in
        view.toggle()
      }

      AsyncFunction("playAsync") { (view: GifView) in
        view.play()
      }

      AsyncFunction("pauseAsync") { (view: GifView) in
        view.pause()
      }
    }
  }
}
