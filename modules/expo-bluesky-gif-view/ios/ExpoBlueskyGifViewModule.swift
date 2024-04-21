import ExpoModulesCore
import SDWebImage
import SDWebImageWebPCoder

public class ExpoBlueskyGifViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyGifView")
    
    OnCreate {
      // See expo-image. SDImageAWebPCoder is preferred (and uses Apple's own WebP coder)
      // but only is available on 14.0+. We probably don't have many users on iOS 13 but
      // for now let's keep it there until RN targets change.
      if #available(iOS 14.0, tvOS 14.0, *) {
        SDImageCodersManager.shared.addCoder(SDImageAWebPCoder.shared)
      } else {
        SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
      }
    }
    
    AsyncFunction("prefetchAsync") { (sources: [URL]) in
      SDWebImagePrefetcher.shared.prefetchURLs(sources, context: Util.createContext(), progress: nil)
    }

    View(GifView.self) {
      Events(
        "onPlayerStateChange"
      )
      
      Prop("webpSource") { (view: GifView, prop: String) in
        view.webpSource = prop
      }
      
      Prop("placeholderSource") { (view: GifView, prop: String) in
        view.placeholderSource = prop
      }
      
      Prop("autoplay") { (view: GifView, prop: Bool) in
        view.autoplay = prop
        
        // Done on purpose. We want to change this value whenever the prop
        // changes
        view.isPlaying = prop
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
