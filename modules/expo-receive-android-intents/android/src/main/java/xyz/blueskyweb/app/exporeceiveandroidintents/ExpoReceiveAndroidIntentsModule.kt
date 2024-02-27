package xyz.blueskyweb.app.exporeceiveandroidintents

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.core.net.toUri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.net.URLEncoder

class ExpoReceiveAndroidIntentsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoReceiveAndroidIntents")

    OnNewIntent {
      handleIntent(it)
    }
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
      "bluesky://intent/compose?text=${encoded}".toUri().let { uri ->
        val newIntent = Intent(Intent.ACTION_VIEW, uri)
        appContext.currentActivity?.startActivity(newIntent)
      }
    }
  }

  private fun handleImageIntent(intent: Intent) {
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
        handleImageIntents(it.filterIsInstance<Uri>().take(4))
      }
    } else {
      intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.let {
        handleImageIntents(it.filterIsInstance<Uri>().take(4))
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

    "bluesky://intent/compose?imageUris=${encoded}".toUri().let {
      val newIntent = Intent(Intent.ACTION_VIEW, it)
      appContext.currentActivity?.startActivity(newIntent)
    }
  }

  private fun getImageInfo(uri: Uri): Map<String, Any> {
    val bitmap = MediaStore.Images.Media.getBitmap(appContext.currentActivity?.contentResolver, uri)
    // We have to save this so that we can access it later when uploading the image.
    // createTempFile will automatically place a unique string between "img" and "temp.jpeg"
    val file = File.createTempFile("img", "temp.jpeg", appContext.currentActivity?.cacheDir)
    val out = FileOutputStream(file)
    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out)
    out.flush()
    out.close()

    return mapOf(
      "width" to bitmap.width,
      "height" to bitmap.height,
      "path" to file.path.toString()
    )
  }

  // We will pas the width and height to the app here, since getting measurements
  // on the RN side is a bit more involved, and we already have them here anyway.
  private fun buildUriData(info: Map<String, Any>): String {
    val path = info.getValue("path")
    val width = info.getValue("width")
    val height = info.getValue("height")
    return "file://${path}|${width}|${height}"
  }
}
