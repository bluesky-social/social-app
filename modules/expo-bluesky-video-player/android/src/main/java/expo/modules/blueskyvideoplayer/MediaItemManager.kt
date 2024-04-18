package expo.modules.blueskyvideoplayer

import android.net.Uri
import androidx.media3.common.MediaItem
import expo.modules.kotlin.AppContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okio.IOException
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest

class MediaItemManager(private val appContext: AppContext) {
  companion object {
    private val client = OkHttpClient()
  }

  fun getItem(source: String): MediaItem {
    val path = createPath(source)
    return if (File(path).exists()) {
      MediaItem.fromUri(Uri.parse(path))
    } else {
      saveToCache(source)
      MediaItem.fromUri(Uri.parse(source))
    }
  }

  fun saveToCache(source: String) {
    val request = Request.Builder()
      .url(source)
      .build()

    client.newCall(request).enqueue(object : okhttp3.Callback {
      override fun onFailure(call: okhttp3.Call, e: IOException) {
        e.printStackTrace()  // Handle the error
      }

      override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
        val path = createPath(source)
        if (response.isSuccessful) {
          val file = File(path)
          val fos = FileOutputStream(file)
          val inputStream = response.body?.byteStream()

          inputStream?.use { input ->
            fos.use { fileOut ->
              input.copyTo(fileOut)
            }
          }
        }
      }
    })
  }

  private fun getHash(source: String): String {
    val md = MessageDigest.getInstance("SHA-1")
    val byteArray = md.digest(source.toByteArray())
    return byteArray.joinToString("") { "%02x".format(it) }
  }

  private fun getGifsDirectory(): String {
    val gifsDirectory = appContext.cacheDirectory.path + "/gifs"
    if (!File(gifsDirectory).exists()) {
      File(gifsDirectory).mkdir()
    }
    return gifsDirectory
  }

  private fun createPath(source: String): String {
    return getGifsDirectory() + "/" + getHash(source)
  }
}