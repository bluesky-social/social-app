package expo.modules.blueskyvideocompress

import android.graphics.SurfaceTexture
import android.os.Handler
import android.os.HandlerThread
import android.view.Surface

/**
 * Wraps a SurfaceTexture to receive decoded frames and render them via GL.
 * The decoder outputs to this surface, and drawImage() renders the latest
 * frame through the TextureRenderer onto the current EGL surface (the encoder's
 * input via InputSurface).
 *
 * Uses a dedicated HandlerThread for frame-available callbacks so they fire
 * reliably regardless of the calling thread's Looper state.
 */
class OutputSurface : SurfaceTexture.OnFrameAvailableListener {
  private val renderer = TextureRenderer()
  private var surfaceTexture: SurfaceTexture? = null
  private val stMatrix = FloatArray(16)
  private val callbackThread = HandlerThread("OutputSurfaceCallbacks")

  val surface: Surface

  @Volatile
  private var frameAvailable = false
  private val frameSyncObject = Object()

  init {
    renderer.surfaceCreated()

    callbackThread.start()
    val handler = Handler(callbackThread.looper)

    surfaceTexture = SurfaceTexture(renderer.getTextureId()).also {
      it.setOnFrameAvailableListener(this, handler)
    }
    surface = Surface(surfaceTexture)
  }

  fun release() {
    surface.release()
    surfaceTexture?.release()
    surfaceTexture = null
    callbackThread.quitSafely()
  }

  /**
   * Blocks until a new frame is available from the decoder (up to 2500ms).
   */
  fun awaitNewImage() {
    val timeoutMs = 2500L
    synchronized(frameSyncObject) {
      while (!frameAvailable) {
        frameSyncObject.wait(timeoutMs)
        if (!frameAvailable) {
          throw RuntimeException("Surface frame wait timed out")
        }
      }
      frameAvailable = false
    }
    // Must be called outside synchronized to avoid deadlock with onFrameAvailable
    surfaceTexture!!.updateTexImage()
  }

  /**
   * Renders the most recent frame through the GL pipeline.
   */
  fun drawImage() {
    surfaceTexture!!.getTransformMatrix(stMatrix)
    renderer.drawFrame(stMatrix)
  }

  override fun onFrameAvailable(st: SurfaceTexture) {
    synchronized(frameSyncObject) {
      frameAvailable = true
      frameSyncObject.notifyAll()
    }
  }
}
