package expo.modules.blueskyvideoplayer

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyVideoPlayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlueskyVideoPlayer")

    AsyncFunction("prefetchAsync") {
      { source: String, promise: Promise ->
        MediaItemManager(appContext).saveToCache(source)
        promise.resolve()
      }
    }

    View(ExpoBlueskyVideoPlayerView::class) {
      Prop("source") { view: ExpoBlueskyVideoPlayerView, source: String ->
          view.source = source
      }

      Prop("autoplay") { view: ExpoBlueskyVideoPlayerView, autoplay: Boolean ->
        view.autoplay = autoplay
      }

      Prop("getIsPlayingAsync") { view, promise: Promise ->
        promise.resolve(view.isPlaying)
      }

      AsyncFunction("playAsync") { view: ExpoBlueskyVideoPlayerView ->
        view.play()
      }

      AsyncFunction("pauseAsync") { view: ExpoBlueskyVideoPlayerView ->
        view.pause()
      }

      AsyncFunction("toggleAsync") { view: ExpoBlueskyVideoPlayerView ->
        view.toggle()
      }

      OnViewDidUpdateProps {
        val source = it.source
        if (source != null) {
          it.updateSource(source)
        }
      }
    }
  }
}
