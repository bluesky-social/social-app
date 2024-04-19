package expo.modules.blueskyvideoplayer

import androidx.media3.common.util.UnstableApi

import android.content.Context
import android.graphics.Color
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

@UnstableApi
class ExpoBlueskyVideoPlayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onPlayerStateChange by EventDispatcher()
  private val playerView: PlayerView
  private var player: ExoPlayer? = null
  private var isLoaded: Boolean = false

  var source: String? = null
  var autoplay: Boolean = true
  var isPlaying: Boolean

  init {
    this.isPlaying = this.autoplay

    this.playerView = PlayerView(context)
      .apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        useController = false
      }

    this.setBackgroundColor(Color.TRANSPARENT)
    this.playerView.setBackgroundColor(Color.TRANSPARENT)

    this.addView(this.playerView)
  }

  override fun onAttachedToWindow() {
    if (this.source == null) {
      return
    }

    val mediaItem = MediaItemManager(appContext).getItem(this.source!!)
    val player = ExoPlayer.Builder(context)
      .setLoadControl(
        DefaultLoadControl.Builder()
          .setBufferDurationsMs(
            500,
            10000,
            1,
            500
          ).build()
      )
      .build().also {
        playerView.player = it
      }.apply {
        repeatMode = ExoPlayer.REPEAT_MODE_ONE
        volume = 0f
      }

    player.addListener(object : Player.Listener {
      override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_READY) {
          isLoaded = true
          firePlayerStateChange()
        }
      }
    })

    player.setMediaItem(mediaItem)
    player.prepare()
    player.playWhenReady = this.autoplay

    this.player = player
    this.playerView.player = player

    super.onAttachedToWindow()
  }

  override fun onDetachedFromWindow() {
    this.player?.removeMediaItem(0)
    this.player?.pause()
    this.player?.release()
    this.player = null
    this.playerView.player = null
    this.isLoaded = false
    this.firePlayerStateChange()

    super.onDetachedFromWindow()
  }

  private fun firePlayerStateChange() {
    onPlayerStateChange(mapOf(
      "isPlaying" to this.isPlaying,
      "isLoaded" to this.isLoaded,
    ))
  }

  fun play() {
    this.player?.play()
    this.isPlaying = true
    this.firePlayerStateChange()
  }

  fun pause() {
    this.player?.pause()
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
}
