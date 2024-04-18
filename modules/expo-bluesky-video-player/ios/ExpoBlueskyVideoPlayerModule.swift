import ExpoModulesCore

public class ExpoBlueskyVideoPlayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyVideoPlayer")
    
    AsyncFunction("setShouldAutoplayAsync") { (value: Bool) in
      
    }
    
    AsyncFunction("prefetchAsync") { (source: String) in
      PlayerItemManager.shared.getOrAddItem(source: source)
    }

    View(ExpoBlueskyVideoPlayerView.self) {
      Events(["onLoad"])
      
      Prop("source") { (view: ExpoBlueskyVideoPlayerView, prop: String) in
        view.source = prop
      }
      
      AsyncFunction("getIsPlayingAsync") { (view: ExpoBlueskyVideoPlayerView, promise: Promise) in
        promise.resolve(view.isPlaying)
      }
      
      AsyncFunction("playAsync") { (view: ExpoBlueskyVideoPlayerView) in
        view.play()
      }
      
      AsyncFunction("pauseAsync") { (view: ExpoBlueskyVideoPlayerView) in
        view.pause()
      }
    }
  }
}
