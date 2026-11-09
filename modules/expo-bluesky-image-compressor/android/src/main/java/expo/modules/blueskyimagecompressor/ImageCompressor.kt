package expo.modules.blueskyimagecompressor

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import expo.modules.kotlin.exception.CodedException
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

internal class CompressedImage(
  val file: File,
  val width: Int,
  val height: Int,
  val size: Int,
  val quality: Int,
)

internal class InvalidOptionsException : CodedException("maxDimension and maxBytes must be positive")

internal class UnsupportedSourceException(
  source: String,
) : CodedException("Unsupported image source: $source")

internal class DecodingFailedException(
  source: String,
) : CodedException("Could not decode the image: $source")

internal class EncodingFailedException : CodedException("Could not encode the image")

internal class DoesNotFitException : CodedException("Unable to compress image")

/**
 * Re-encodes an image as a JPEG that fits a pixel and byte budget. See the
 * README.
 */
internal class ImageCompressor(
  private val contentResolver: ContentResolver,
) {
  fun compress(
    uri: String,
    maxDimension: Int,
    maxBytes: Int,
    outputDirectory: File,
  ): CompressedImage {
    if (maxDimension <= 0 || maxBytes <= 0) {
      throw InvalidOptionsException()
    }
    val open = opener(uri)

    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    open().use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
      throw DecodingFailedException(describe(uri))
    }
    val orientation = readOrientation(open)

    var longSide = min(max(bounds.outWidth, bounds.outHeight), maxDimension)
    repeat(MAX_DIMENSION_ATTEMPTS) {
      val bitmap = decode(open, bounds, orientation, longSide, uri)
      try {
        val fit = findEncoding(bitmap, maxBytes)
        if (fit != null) {
          return CompressedImage(
            file = write(fit.payload, outputDirectory),
            width = bitmap.width,
            height = bitmap.height,
            size = fit.size,
            quality = fit.quality,
          )
        }
        longSide = (max(bitmap.width, bitmap.height) * SHRINK_FACTOR).toInt()
      } finally {
        bitmap.recycle()
      }
    }
    throw DoesNotFitException()
  }

  private fun opener(uri: String): () -> InputStream {
    if (uri.startsWith("data:")) {
      val comma = uri.indexOf(',')
      if (comma < 0 || !uri.substring(0, comma).endsWith(";base64")) {
        throw UnsupportedSourceException("non-base64 data URI")
      }
      val bytes = Base64.decode(uri.substring(comma + 1), Base64.DEFAULT)
      return { ByteArrayInputStream(bytes) }
    }
    if (uri.startsWith("/")) {
      return { FileInputStream(uri) }
    }
    val parsed = Uri.parse(uri)
    if (parsed.scheme != ContentResolver.SCHEME_FILE && parsed.scheme != ContentResolver.SCHEME_CONTENT) {
      throw UnsupportedSourceException(uri)
    }
    return {
      contentResolver.openInputStream(parsed) ?: throw DecodingFailedException(uri)
    }
  }

  private fun readOrientation(open: () -> InputStream): Int =
    try {
      open().use {
        ExifInterface(it).getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_NORMAL,
        )
      }
    } catch (e: Exception) {
      // Formats without EXIF can throw rather than report no orientation.
      ExifInterface.ORIENTATION_NORMAL
    }

  /**
   * Decodes with the largest power-of-two subsampling that stays at or above
   * the target size, then scales the rest of the way, applies the EXIF
   * orientation and flattens any transparency onto white in a single draw.
   */
  private fun decode(
    open: () -> InputStream,
    bounds: BitmapFactory.Options,
    orientation: Int,
    longSide: Int,
    uri: String,
  ): Bitmap {
    val swapsAxes = orientation in QUARTER_TURN_ORIENTATIONS
    val scale = min(1.0, longSide.toDouble() / max(bounds.outWidth, bounds.outHeight))
    // Target size in stored (unrotated) pixels
    val targetWidth = max(1, (bounds.outWidth * scale).toInt())
    val targetHeight = max(1, (bounds.outHeight * scale).toInt())

    var sampleSize = 1
    while (bounds.outWidth / (sampleSize * 2) >= targetWidth &&
      bounds.outHeight / (sampleSize * 2) >= targetHeight
    ) {
      sampleSize *= 2
    }
    val decoded =
      open().use {
        BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sampleSize })
      } ?: throw DecodingFailedException(describe(uri))

    val rotation = orientationMatrix(orientation)
    if (decoded.width == targetWidth &&
      decoded.height == targetHeight &&
      rotation.isIdentity &&
      !decoded.hasAlpha()
    ) {
      return decoded
    }

    val outWidth = if (swapsAxes) targetHeight else targetWidth
    val outHeight = if (swapsAxes) targetWidth else targetHeight
    // Scale in stored axes, then rotate about the center into the output
    val transform =
      Matrix().apply {
        postTranslate(-decoded.width / 2f, -decoded.height / 2f)
        postScale(targetWidth.toFloat() / decoded.width, targetHeight.toFloat() / decoded.height)
        postConcat(rotation)
        postTranslate(outWidth / 2f, outHeight / 2f)
      }
    val output = Bitmap.createBitmap(outWidth, outHeight, Bitmap.Config.ARGB_8888)
    Canvas(output).apply {
      drawColor(Color.WHITE)
      drawBitmap(decoded, transform, Paint(Paint.FILTER_BITMAP_FLAG))
    }
    decoded.recycle()
    return output
  }

  private fun findEncoding(
    bitmap: Bitmap,
    maxBytes: Int,
  ): QualitySearch.Fit<ByteArray>? {
    val buffer = ByteArrayOutputStream()
    val search = QualitySearch<ByteArray>(maxBytes)
    while (true) {
      val quality = search.nextQuality() ?: break
      buffer.reset()
      if (!bitmap.compress(Bitmap.CompressFormat.JPEG, quality, buffer)) {
        throw EncodingFailedException()
      }
      search.record(quality, buffer.size()) { buffer.toByteArray() }
    }
    return search.best
  }

  private fun write(
    bytes: ByteArray,
    directory: File,
  ): File {
    directory.mkdirs()
    return File(directory, "${UUID.randomUUID()}.jpg").apply { writeBytes(bytes) }
  }

  /** Keeps data URIs out of error messages. */
  private fun describe(uri: String) = if (uri.startsWith("data:")) "data URI" else uri

  companion object {
    const val MAX_DIMENSION_ATTEMPTS = 4
    const val SHRINK_FACTOR = 0.8

    private val QUARTER_TURN_ORIENTATIONS =
      setOf(
        ExifInterface.ORIENTATION_TRANSPOSE,
        ExifInterface.ORIENTATION_ROTATE_90,
        ExifInterface.ORIENTATION_TRANSVERSE,
        ExifInterface.ORIENTATION_ROTATE_270,
      )

    /** Same mapping as Glide's TransformationUtils. Rotates about the origin. */
    private fun orientationMatrix(orientation: Int) =
      Matrix().apply {
        when (orientation) {
          ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> setScale(-1f, 1f)
          ExifInterface.ORIENTATION_ROTATE_180 -> setRotate(180f)
          ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
            setRotate(180f)
            postScale(-1f, 1f)
          }
          ExifInterface.ORIENTATION_TRANSPOSE -> {
            setRotate(90f)
            postScale(-1f, 1f)
          }
          ExifInterface.ORIENTATION_ROTATE_90 -> setRotate(90f)
          ExifInterface.ORIENTATION_TRANSVERSE -> {
            setRotate(-90f)
            postScale(-1f, 1f)
          }
          ExifInterface.ORIENTATION_ROTATE_270 -> setRotate(-90f)
        }
      }
  }
}
