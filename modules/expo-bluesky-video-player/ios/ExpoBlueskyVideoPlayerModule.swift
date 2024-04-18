import ExpoModulesCore

public class ExpoBlueskyVideoPlayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyVideoPlayer")
    
    AsyncFunction("prefetchAsync") { (source: String, promise: Promise) in
      PlayerItemManager.shared.saveToCache(source: source)
      promise.resolve()
    }

    View(ExpoBlueskyVideoPlayerView.self) {
      Events(["onLoad"])
      
      Prop("source") { (view: ExpoBlueskyVideoPlayerView, prop: String) in
        view.source = prop
      }
      
      Prop("autoplay") { (view: ExpoBlueskyVideoPlayerView, prop: Bool) in
        view.autoplay = prop
      }
      
      AsyncFunction("getIsPlayingAsync") { (view: ExpoBlueskyVideoPlayerView, promise: Promise) in
        promise.resolve(view.isPlaying)
      }
      
      AsyncFunction("toggleAsync") { (view: ExpoBlueskyVideoPlayerView, promise: Promise) in
        view.toggle()
        promise.resolve()
      }
      
      AsyncFunction("playAsync") { (view: ExpoBlueskyVideoPlayerView, promise: Promise) in
        view.play()
        promise.resolve()
      }
      
      AsyncFunction("pauseAsync") { (view: ExpoBlueskyVideoPlayerView, promise: Promise) in
        view.pause()
        promise.resolve()
      }
    }
  }
}
