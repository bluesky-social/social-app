package xyz.blueskyweb.app.exporeceiveandroidintents

import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.core.net.toUri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.net.URLEncoder

enum class AttachmentType {
  IMAGE,
  VIDEO,
}

class ExpoReceiveAndroidIntentsModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoReceiveAndroidIntents")

      OnCreate {
        handleIntent(appContext.currentActivity?.intent)
      }

      OnNewIntent {
        handleIntent(it)
      }
    }

  private fun handleIntent(intent: Intent?) {
    if (appContext.currentActivity == null) return
    intent?.let {
      if (it.action == Intent.ACTION_SEND && it.type == "text/plain") {
        handleTextIntent(it)
        return
      }

      val type =
        if (it.type.toString().startsWith("image/")) {
          AttachmentType.IMAGE
        } else if (it.type.toString().startsWith("video/")) {
          AttachmentType.VIDEO
        } else {
          return
        }

      if (it.action == Intent.ACTION_SEND) {
        handleAttachmentIntent(it, type)
      } else if (it.action == Intent.ACTION_SEND_MULTIPLE) {
        handleAttachmentsIntent(it, type)
      }
    }
  }

  private fun handleTextIntent(intent: Intent) {
    intent.getStringExtra(Intent.EXTRA_TEXT)?.let {
      val encoded = URLEncoder.encode(it, "UTF-8")
      "bluesky://intent/compose?text=$encoded".toUri().let { uri ->
        val newIntent = Intent(Intent.ACTION_VIEW, uri)
        appContext.currentActivity?.startActivity(newIntent)
      }
    }
  }

  private fun handleAttachmentIntent(
    intent: Intent,
    type: AttachmentType,
  ) {
    val uri =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
      } else {
        intent.getParcelableExtra(Intent.EXTRA_STREAM)
      }

    uri?.let {
      when (type) {
        AttachmentType.IMAGE -> handleImageIntents(listOf(it))
        AttachmentType.VIDEO -> handleVideoIntents(listOf(it))
      }
    }
  }

  private fun handleAttachmentsIntent(
    intent: Intent,
    type: AttachmentType,
  ) {
    val uris =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent
          .getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
          ?.filterIsInstance<Uri>()
          ?.take(4)
      } else {
        intent
          .getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
          ?.filterIsInstance<Uri>()
          ?.take(4)
      }

    uris?.let {
      when (type) {
        AttachmentType.IMAGE -> handleImageIntents(it)
        else -> return
      }
    }
  }

  private fun handleImageIntents(uris: List<Uri>) {
    var allParams = ""

    uris.forEachIndexed { index, uri ->
      val info = getImageInfo(uri)
      val params = buildUriData(info)
      allParams = "${allParams}$params"

      if (index < uris.count() - 1) {
        allParams = "$allParams,"
      }
    }

    val encoded = URLEncoder.encode(allParams, "UTF-8")

    "bluesky://intent/compose?imageUris=$encoded".toUri().let {
      val newIntent = Intent(Intent.ACTION_VIEW, it)
      appContext.currentActivity?.startActivity(newIntent)
    }
  }

  private fun handleVideoIntents(uris: List<Uri>) {
    val uri = uris[0]
    // If there is no extension for the file, substringAfterLast returns the original string - not
    // null, so we check for that below
    // It doesn't actually matter what the extension is, so defaulting to mp4 is fine, even if the
    // video isn't actually an mp4
    var extension = uri.path?.substringAfterLast(".")
    if (extension == null || extension == uri.path) {
      extension = "mp4"
    }
    val file = createFile(extension)

    val out = FileOutputStream(file)
    appContext.currentActivity?.contentResolver?.openInputStream(uri)?.use {
      it.copyTo(out)
    }

    val info = getVideoInfo(uri) ?: return

    "bluesky://intent/compose?videoUri=${URLEncoder.encode(file.path, "UTF-8")}|${info["width"]}|${info["height"]}".toUri().let {
      val newIntent = Intent(Intent.ACTION_VIEW, it)
      appContext.currentActivity?.startActivity(newIntent)
    }
  }

  private fun getImageInfo(uri: Uri): Map<String, Any> {
    val bitmap = MediaStore.Images.Media.getBitmap(appContext.currentActivity?.contentResolver, uri)
    // We have to save this so that we can access it later when uploading the image.
    // createTempFile will automatically place a unique string between "img" and "temp.jpeg"
    val file = createFile("jpeg")
    val out = FileOutputStream(file)
    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out)
    out.flush()
    out.close()

    return mapOf(
      "width" to bitmap.width,
      "height" to bitmap.height,
      "path" to file.path.toString(),
    )
  }

  private fun getVideoInfo(uri: Uri): Map<String, Any>? {
    val retriever = MediaMetadataRetriever()
    retriever.setDataSource(appContext.currentActivity, uri)

    val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()
    val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()

    if (width == null || height == null) {
      return null
    }

    return mapOf(
      "width" to width,
      "height" to height,
      "path" to uri.path.toString(),
    )
  }

  private fun createFile(extension: String): File = File.createTempFile(extension, "temp.$extension", appContext.currentActivity?.cacheDir)

  // We will pas the width and height to the app here, since getting measurements
  // on the RN side is a bit more involved, and we already have them here anyway.
  private fun buildUriData(info: Map<String, Any>): String {
    val path = info.getValue("path")
    val width = info.getValue("width")
    val height = info.getValue("height")
    return "file://$path|$width|$height"
  }
}
