package expo.modules.blueskyswissarmy.hlsdownload

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.util.Base64
import android.util.Log
import android.webkit.DownloadListener
import android.webkit.WebView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.FileOutputStream
import java.net.URI
import java.util.UUID

class HLSDownloadView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  DownloadListener {
  val webView = WebView(context)

  var downloaderUrl: Uri? = null

  private val onStart by EventDispatcher()
  private val onError by EventDispatcher()
  private val onProgress by EventDispatcher()
  private val onSuccess by EventDispatcher()

  init {
    this.setupWebView()
    this.addView(this.webView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun setupWebView() {
    val webSettings = this.webView.settings
    webSettings.javaScriptEnabled = true
    webSettings.domStorageEnabled = true

    webView.setDownloadListener(this)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    this.webView.stopLoading()
  }

  fun startDownload(sourceUrl: Uri) {
    val url = URI("${this.downloaderUrl}?videoUrl=$sourceUrl")
    this.webView.loadUrl(url.toString())
    this.onStart(mapOf())
  }

  override fun onDownloadStart(
    url: String?,
    userAgent: String?,
    contentDisposition: String?,
    mimeType: String?,
    contentLength: Long,
  ) {
    if (url == null) {
      this.onError(mapOf("error" to "Failed to retrieve download URL from webview."))
      return
    }

    val tempDir = context.cacheDir
    val fileName = "${UUID.randomUUID()}.mp4"
    val file = File(tempDir, fileName)

    val base64 = url.split(",")[1]
    val bytes = Base64.decode(base64, Base64.DEFAULT)

    val fos = FileOutputStream(file)
    try {
      fos.write(bytes)
    } catch (e: Exception) {
      Log.e("FileDownload", "Error downloading file", e)
      this.onError(mapOf("error" to e.message.toString()))
      return
    } finally {
      fos.close()
    }

    val uri = Uri.fromFile(file)
    this.onSuccess(mapOf("uri" to uri.toString()))
  }
}
