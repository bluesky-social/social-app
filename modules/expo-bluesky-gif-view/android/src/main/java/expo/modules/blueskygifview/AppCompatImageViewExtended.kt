package expo.modules.blueskygifview

import android.content.Context
import android.graphics.Canvas
import android.graphics.drawable.Animatable
import androidx.appcompat.widget.AppCompatImageView

class AppCompatImageViewExtended(
  context: Context,
  private val parent: GifView,
) : AppCompatImageView(context) {
  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    if (this.drawable is Animatable) {
      if (!parent.isLoaded) {
        parent.isLoaded = true
        parent.firePlayerStateChange()
      }

      if (!parent.isPlaying) {
        this.pause()
      }
    }
  }

  fun pause() {
    val drawable = this.drawable
    if (drawable is Animatable) {
      drawable.stop()
    }
  }

  fun play() {
    val drawable = this.drawable
    if (drawable is Animatable) {
      drawable.start()
    }
  }
}
