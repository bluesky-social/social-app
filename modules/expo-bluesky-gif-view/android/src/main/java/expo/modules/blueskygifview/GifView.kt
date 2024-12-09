package expo.modules.blueskygifview

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class GifView(
        context: Context,
        appContext: AppContext,
) : ExpoView(context, appContext) {
  // Events
  private val onPlayerStateChange by EventDispatcher()

  // Glide
  private val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private val glide = Glide.with(activity)
  val imageView = AppCompatImageViewExtended(context, this)
  var isPlaying = true
  var isLoaded = false

  // Requests
  private var placeholderRequest: Target<Drawable>? = null
  private var webpRequest: Target<Drawable>? = null

  // Props
  var placeholderSource: String? = null
  var source: String? = null
  var autoplay: Boolean = true
    set(value) {
      field = value

      if (value) {
        this.play()
      } else {
        this.pause()
      }
    }

  // <editor-fold desc="Lifecycle">

  init {
    this.setBackgroundColor(Color.TRANSPARENT)

    this.imageView.setBackgroundColor(Color.TRANSPARENT)
    this.imageView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)

    this.addView(this.imageView)
  }

  override fun onAttachedToWindow() {
    if (this.imageView.drawable == null || this.imageView.drawable !is Animatable) {
      this.load()
    } else if (this.isPlaying) {
      this.imageView.play()
    }
    super.onAttachedToWindow()
  }

  override fun onDetachedFromWindow() {
    this.imageView.pause()
    super.onDetachedFromWindow()
  }

  // </editor-fold>

  // <editor-fold desc="Loading">

  private fun load() {
    if (placeholderSource == null || source == null) {
      return
    }

    this.webpRequest =
            glide.load(source)
                    .diskCacheStrategy(DiskCacheStrategy.DATA)
                    .skipMemoryCache(false)
                    .listener(
                            object : RequestListener<Drawable> {
                              override fun onResourceReady(
                                      resource: Drawable,
                                      model: Any,
                                      target: Target<Drawable>?,
                                      dataSource: DataSource,
                                      isFirstResource: Boolean
                              ): Boolean {
                                placeholderRequest?.let { glide.clear(it) }
                                return false
                              }

                              override fun onLoadFailed(
                                      e: GlideException?,
                                      model: Any?,
                                      target: Target<Drawable>,
                                      isFirstResource: Boolean
                              ): Boolean = true
                            }
                    )
                    .into(this.imageView)

    if (this.imageView.drawable == null || this.imageView.drawable !is Animatable) {
      this.placeholderRequest =
              glide.load(placeholderSource)
                      .diskCacheStrategy(DiskCacheStrategy.DATA)
                      // Let's not bloat the memory cache with placeholders
                      .skipMemoryCache(true)
                      .listener(
                              object : RequestListener<Drawable> {
                                override fun onResourceReady(
                                        resource: Drawable,
                                        model: Any,
                                        target: Target<Drawable>?,
                                        dataSource: DataSource,
                                        isFirstResource: Boolean
                                ): Boolean {
                                  // Incase this request finishes after the webp, let's just not set
                                  // the drawable. This shouldn't happen because the request should
                                  // get cancelled
                                  if (imageView.drawable == null) {
                                    imageView.setImageDrawable(resource)
                                  }
                                  return true
                                }

                                override fun onLoadFailed(
                                        e: GlideException?,
                                        model: Any?,
                                        target: Target<Drawable>,
                                        isFirstResource: Boolean
                                ): Boolean = true
                              },
                      )
                      .submit()
    }
  }

  // </editor-fold>

  // <editor-fold desc="Controls">

  fun play() {
    this.imageView.play()
    this.isPlaying = true
    this.firePlayerStateChange()
  }

  fun pause() {
    this.imageView.pause()
    this.isPlaying = false
    this.firePlayerStateChange()
  }

  fun toggle() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  // </editor-fold>

  // <editor-fold desc="Util">

  fun firePlayerStateChange() {
    onPlayerStateChange(
            mapOf(
                    "isPlaying" to this.isPlaying,
                    "isLoaded" to this.isLoaded,
            ),
    )
  }

  // </editor-fold>
}
