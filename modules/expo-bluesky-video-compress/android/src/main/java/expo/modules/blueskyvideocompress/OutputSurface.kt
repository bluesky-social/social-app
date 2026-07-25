package expo.modules.blueskyvideocompress

import android.graphics.SurfaceTexture
import android.os.Handler
import android.os.HandlerThread
import android.view.Surface

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
    surfaceTexture!!.updateTexImage()
  }

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
