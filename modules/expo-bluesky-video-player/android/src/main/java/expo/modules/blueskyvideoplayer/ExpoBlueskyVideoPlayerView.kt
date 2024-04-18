package expo.modules.blueskyvideoplayer

import android.content.Context
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class ExpoBlueskyVideoPlayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var playerView: PlayerView
  private var player: ExoPlayer

  var autoplay: Boolean = true
  var source: String? = null
  var isPlaying = true

  init {
    this.playerView = PlayerView(context).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      useController = false
    }
    this.player = ExoPlayer.Builder(context).build().also {
      playerView.player = it
    }.apply {
      repeatMode = ExoPlayer.REPEAT_MODE_ONE
      volume = 0f
    }
    this.addView(this.playerView)
  }

  override fun onAttachedToWindow() {
    if (this.autoplay && this.isPlaying) {
      this.player.play()
    }
    super.onAttachedToWindow()
  }

  override fun onDetachedFromWindow() {
    this.player.pause()
    super.onDetachedFromWindow()
  }

  fun updateSource(source: String) {
    val mediaItem = MediaItemManager(appContext).getItem(source)
    player.setMediaItem(mediaItem)
    player.prepare()
    player.playWhenReady = true
  }

  fun play() {
    this.player.play()
    this.isPlaying = true
  }

  fun pause() {
    this.player.pause()
    this.isPlaying = false
  }

  fun toggle() {
    if (this.isPlaying) {
      this.player.pause()
      this.isPlaying = false
    } else {
      this.player.play()
      this.isPlaying = true
    }
  }
}
