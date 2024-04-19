package expo.modules.blueskyvideoplayer

import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

@UnstableApi
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
      Events(
        "onPlayerStateChange"
      )

      Prop("source") { view: ExpoBlueskyVideoPlayerView, source: String ->
          view.source = source
      }

      Prop("autoplay") { view: ExpoBlueskyVideoPlayerView, autoplay: Boolean ->
        view.autoplay = autoplay
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
    }
  }
}
