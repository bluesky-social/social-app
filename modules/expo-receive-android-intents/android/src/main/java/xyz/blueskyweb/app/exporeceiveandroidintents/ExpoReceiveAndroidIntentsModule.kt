package xyz.blueskyweb.app.exporeceiveandroidintents

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import androidx.core.net.toUri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.net.URLEncoder

class ExpoReceiveAndroidIntentsModule : Module() {
  var scheme: String? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoReceiveAndroidIntents")

    OnNewIntent {
      handleIntent(it)
    }

    Events("onIntentReceived")
  }

  private fun handleIntent(intent: Intent?) {
    if(appContext.currentActivity == null || intent == null) return

    if (intent.action == Intent.ACTION_SEND) {
      if (intent.type == "text/plain") {
        handleTextIntent(intent)
      } else if (intent.type.toString().startsWith("image/")) {
        handleImageIntent(intent)
      }
    } else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
      if (intent.type.toString().startsWith("image/")) {
        handleImagesIntent(intent)
      }
    }
  }

  private fun handleTextIntent(intent: Intent) {
    intent.getStringExtra(Intent.EXTRA_TEXT)?.let {
      val encoded = URLEncoder.encode(it, "UTF-8")
      "blueskytesting://?compose=true&text=${encoded}".toUri().let { uri ->
        val newIntent = Intent(Intent.ACTION_VIEW, uri)
        appContext.currentActivity?.startActivity(newIntent)
      }
    }
  }

  private fun handleImageIntent(intent: Intent) {
    // Load the URI
    val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
    } else {
      intent.getParcelableExtra(Intent.EXTRA_STREAM)
    }
    if (uri == null) return

    handleImageIntents(listOf(uri))
  }

  private fun handleImagesIntent(intent: Intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)?.let {
        val uris = it.filterIsInstance<Uri>()
        handleImageIntents(uris)
      }
    } else {
      intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.let {
        val uris = it.filterIsInstance<Uri>()
        handleImageIntents(uris)
      }
    }
  }

  private fun handleImageIntents(uris: List<Uri>) {
    var allParams = ""

    uris.forEachIndexed { index, uri ->
      val info = getImageInfo(uri)
      val params = buildUriData(info)
      allParams = "${allParams}${params}"

      if (index < uris.count() - 1) {
        allParams = "${allParams},"
      }
    }

    val encoded = URLEncoder.encode(allParams, "UTF-8")

    scheme?.let { Log.d("EXPPP", it) }

    "blueskytesting://?compose=true&imageUris=${encoded}".toUri().let {
      val newIntent = Intent(Intent.ACTION_VIEW, it)
      appContext.currentActivity?.startActivity(newIntent)
    }
  }

  private fun getImageInfo(uri: Uri): Map<String, Any> {
    // Load the bitmap
    val bitmap = MediaStore.Images.Media.getBitmap(appContext.currentActivity?.contentResolver, uri)

    // Save it to a temp directory we can access
    val file = File.createTempFile("img", "temp.jpeg", appContext.currentActivity?.cacheDir)
    val out = FileOutputStream(file)
    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out)
    out.flush()
    out.close()

    // Return info
    return mapOf(
      "width" to bitmap.width,
      "height" to bitmap.height,
      "path" to file.path.toString()
    )
  }

  private fun buildUriData(info: Map<String, Any>): String {
    val path = info.getValue("path")
    val width = info.getValue("width")
    val height = info.getValue("height")
    return "file://${path}|${width}|${height}"
  }
}
