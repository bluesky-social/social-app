package expo.modules.blueskyswissarmy.instagramstory

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File

/**
 * Shares images to Instagram Stories, opening the story composer with them
 * filled in. See https://developers.facebook.com/docs/instagram-platform/sharing-to-stories
 */
class ExpoBlueskyInstagramStoryModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyInstagramStory")

      /*
       * Whether Instagram is installed and can take a story. Its package must
       * be in the manifest's <queries>, or this is always false.
       */
      AsyncFunction("isAvailable") {
        storyIntent().setType("image/*").resolveActivity(context.packageManager) != null
      }

      AsyncFunction("share") { options: InstagramStoryOptions, promise: Promise ->
        val background = options.backgroundImage?.let { contentUri(it) }
        val sticker = options.stickerImage?.let { contentUri(it) }

        val intent =
          storyIntent().apply {
            putExtra("source_application", options.appId)
            if (background != null) {
              setDataAndType(background, "image/png")
            } else {
              type = "image/png"
            }
            if (sticker != null) {
              putExtra("interactive_asset_uri", sticker)
              context.grantUriPermission(
                INSTAGRAM_PACKAGE,
                sticker,
                Intent.FLAG_GRANT_READ_URI_PERMISSION,
              )
            }
            options.backgroundTopColor?.let { putExtra("top_background_color", it) }
            options.backgroundBottomColor?.let { putExtra("bottom_background_color", it) }
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }

        if (intent.resolveActivity(context.packageManager) == null) {
          promise.reject("E_NOT_INSTALLED", "Instagram can't take a story", null)
          return@AsyncFunction
        }

        val activity = appContext.currentActivity
        try {
          if (activity != null) {
            activity.startActivity(intent)
          } else {
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
          }
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("E_OPEN_FAILED", "Couldn't open Instagram", e)
        }
      }.runOnQueue(Queues.MAIN)
    }

  private fun storyIntent() = Intent(ADD_TO_STORY).setPackage(INSTAGRAM_PACKAGE)

  /** A content URI Instagram can read, for a file in the app's cache. */
  private fun contentUri(uriOrPath: String): Uri {
    val path = if (uriOrPath.startsWith("file://")) Uri.parse(uriOrPath).path else uriOrPath
    return FileProvider.getUriForFile(
      context,
      "${context.packageName}.InstagramStoryFileProvider",
      File(path ?: uriOrPath),
    )
  }

  companion object {
    private const val ADD_TO_STORY = "com.instagram.share.ADD_TO_STORY"
    private const val INSTAGRAM_PACKAGE = "com.instagram.android"
  }
}

class InstagramStoryOptions : Record {
  /** The Facebook App ID. Instagram rejects stories without a registered one. */
  @Field var appId: String = ""

  /** A full-screen image, 9:16. */
  @Field var backgroundImage: String? = null

  /** An image laid over the background, which the person can move and resize. */
  @Field var stickerImage: String? = null

  /** Hex colors for a gradient behind the sticker, when there's no background. */
  @Field var backgroundTopColor: String? = null

  @Field var backgroundBottomColor: String? = null
}
