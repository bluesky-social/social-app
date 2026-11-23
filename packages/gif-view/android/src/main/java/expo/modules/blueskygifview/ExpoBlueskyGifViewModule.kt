package expo.modules.blueskygifview

import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyGifViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyGifView")

      AsyncFunction("prefetchAsync") { sources: List<String> ->
        val activity = appContext.currentActivity ?: return@AsyncFunction
        val glide = Glide.with(activity)

        sources.forEach { source ->
          glide
            .download(source)
            .diskCacheStrategy(DiskCacheStrategy.DATA)
            .submit()
        }
      }

      View(GifView::class) {
        Events(
          "onPlayerStateChange",
        )

        Prop("source") { view: GifView, source: String ->
          view.source = source
        }

        Prop("placeholderSource") { view: GifView, source: String ->
          view.placeholderSource = source
        }

        Prop("autoplay") { view: GifView, autoplay: Boolean ->
          view.autoplay = autoplay
        }

        AsyncFunction("playAsync") { view: GifView ->
          view.play()
        }

        AsyncFunction("pauseAsync") { view: GifView ->
          view.pause()
        }

        AsyncFunction("toggleAsync") { view: GifView ->
          view.toggle()
        }
      }
    }
}
