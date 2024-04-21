package expo.modules.blueskygifview


import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

class GifView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  // Events
  private val onPlayerStateChange by EventDispatcher()

  // Glide
  private val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private val glide: RequestManager = Glide.with(activity)
  private val imageView = AppCompatImageView(context)

  // Requests
  private var placeholderRequest: Target<Drawable>? = null
  private var webpRequest: Target<Drawable>? = null

  // Props
  var placeholderSource: String? = null
  var webpSource: String? = null
  var autoplay: Boolean = true
    set(value) {
      field = value

      if (value) {
        this.play()
      } else {
        this.pause()
      }
    }
  var isPlaying: Boolean = true


  //<editor-fold desc="Lifecycle">

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
      this.setIsAnimating(true)
    }
    ExpoBlueskyGifViewModule.visibleViews.add(WeakReference(this))
    super.onAttachedToWindow()
  }

  override fun onDetachedFromWindow() {
    this.setIsAnimating(false)
    ExpoBlueskyGifViewModule.visibleViews.remove(WeakReference(this))
    super.onDetachedFromWindow()
  }

  //</editor-fold>

  //<editor-fold desc="Loading">

  private fun load() {
    if (placeholderSource == null || webpSource == null) {
      return
    }

    this.webpRequest = glide.load(webpSource)
      .diskCacheStrategy(DiskCacheStrategy.DATA)
      .skipMemoryCache(false)
      .listener(object: RequestListener<Drawable> {
        override fun onResourceReady(
          resource: Drawable?,
          model: Any?,
          target: Target<Drawable>?,
          dataSource: com.bumptech.glide.load.DataSource?,
          isFirstResource: Boolean
        ): Boolean {
          if (placeholderRequest != null) {
            glide.clear(placeholderRequest)
          }

          // Glide always autoplays the animations, so if we have autoplay disabled let's stop it
          if (resource is Animatable && !autoplay) {
            resource.stop()
          }
          return false
        }

        override fun onLoadFailed(
          e: GlideException?,
          model: Any?,
          target: Target<Drawable>?,
          isFirstResource: Boolean
        ): Boolean {
          return true
        }
      })
      .into(this.imageView)

    if (this.imageView.drawable == null || this.imageView.drawable !is Animatable) {
      this.placeholderRequest = glide.load(placeholderSource)
        .diskCacheStrategy(DiskCacheStrategy.DATA)
        // Let's not bloat the memory cache with placeholders
        .skipMemoryCache(true)
        .listener(object: RequestListener<Drawable> {
          override fun onResourceReady(
            resource: Drawable?,
            model: Any?,
            target: Target<Drawable>?,
            dataSource: com.bumptech.glide.load.DataSource?,
            isFirstResource: Boolean
          ): Boolean {
            // Incase this request finishes after the webp, let's just not set
            // the drawable. This shouldn't happen because the request should get cancelled
            if (imageView.drawable == null) {
              imageView.setImageDrawable(resource)
            }
            return true
          }

          override fun onLoadFailed(
            e: GlideException?,
            model: Any?,
            target: Target<Drawable>?,
            isFirstResource: Boolean
          ): Boolean {
            return true
          }
        })
        .submit()
    }
  }

  //</editor-fold>

  //<editor-fold desc="Controls">

  fun setIsAnimating(isAnimating: Boolean) {
    val drawable = this.imageView.drawable

    if (drawable is Animatable) {
      if (isAnimating) {
        drawable.start()
      } else {
        drawable.stop()
      }
    }
  }

  fun play() {
    this.setIsAnimating(true)
    this.isPlaying = true
    this.firePlayerStateChange()
  }

  fun pause() {
    this.setIsAnimating(false)
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

  //</editor-fold>

  //<editor-fold desc="Util">

  private fun firePlayerStateChange() {
    onPlayerStateChange(mapOf(
      "isPlaying" to this.isPlaying,
    ))
  }

  //</editor-fold>
}
