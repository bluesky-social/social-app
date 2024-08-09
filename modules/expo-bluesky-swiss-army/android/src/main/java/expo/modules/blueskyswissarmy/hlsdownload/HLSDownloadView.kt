package expo.modules.blueskyswissarmy.hlsdownload

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.webkit.DownloadListener
import android.webkit.WebView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.net.URI
import java.util.UUID

class HLSDownloadView(
  context: Context,
  appContext: AppContext,
): ExpoView(context, appContext), DownloadListener {
  val webView = WebView(context)

  var downloaderUrl: Uri? = null

  private var downloadId: Long? = null
  private var outputUrl: Uri? = null

  private val onStart by EventDispatcher()
  private val onError by EventDispatcher()
  private val onProgress by EventDispatcher()
  private val onSuccess by EventDispatcher()

  init {
    this.setupWebView()
    this.addView(this.webView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

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
    val url = URI("${this.downloaderUrl}?videoUrl=${sourceUrl}")
    this.webView.loadUrl(url.toString())
    this.onStart(mapOf())
  }

  override fun onDownloadStart(
    url: String?,
    userAgent: String?,
    contentDisposition: String?,
    mimeType: String?,
    contentLength: Long
  ) {
    val tempDir = context.cacheDir
    val fileName = "${UUID.randomUUID()}.mp4"
    val file = File(tempDir, fileName)

    val request = DownloadManager.Request(Uri.parse(url))
    request.setMimeType(mimeType)
    request.addRequestHeader("User-Agent", userAgent)
    request.setTitle("Downloading video")
    request.setMimeType("HLS video download in progress")
    request.setAllowedOverMetered(true)
    request.setAllowedOverRoaming(false)

    request.setDestinationUri(Uri.fromFile(file))

    val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    this.downloadId = downloadManager.enqueue(request)
    val outputUrl = Uri.fromFile(file)
    this.onSuccess(
      mapOf(
        "uri" to outputUrl
      )
    )
  }
}
