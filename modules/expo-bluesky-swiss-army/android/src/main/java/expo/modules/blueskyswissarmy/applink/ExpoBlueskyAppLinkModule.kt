package expo.modules.blueskyswissarmy.applink

import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyAppLinkModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyAppLink")

      AsyncFunction("tryOpen") { url: String ->
        val uri = Uri.parse(url)
        if (uri.scheme?.lowercase() !in listOf("http", "https") || uri.host.isNullOrEmpty()) {
          return@AsyncFunction false
        }
        val activity = appContext.currentActivity ?: return@AsyncFunction false
        val intent = Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          intent.addFlags(
            Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER or Intent.FLAG_ACTIVITY_REQUIRE_DEFAULT,
          )
        } else if (!prepareLegacyIntent(intent, activity.packageManager)) {
          return@AsyncFunction false
        }

        try {
          activity.startActivity(intent)
          true
        } catch (_: ActivityNotFoundException) {
          false
        }
      }.runOnQueue(Queues.MAIN)
    }

  /**
   * Before Android 11, only open an already-resolved non-browser default.
   * Pinning that OS-selected activity prevents a chooser if handlers change.
   */
  private fun prepareLegacyIntent(
    intent: Intent,
    packageManager: PackageManager,
  ): Boolean {
    val resolved =
      packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo
        ?: return false
    val handlers = packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
    if (
      handlers.none {
        it.activityInfo.packageName == resolved.packageName && it.activityInfo.name == resolved.name
      }
    ) {
      // The system resolved to a chooser, not one of the actual URL handlers.
      return false
    }

    // Browsers handle a scheme with no host; domain-specific apps do not.
    val browserIntent =
      Intent(Intent.ACTION_VIEW, Uri.parse("${intent.data?.scheme}://"))
        .addCategory(Intent.CATEGORY_BROWSABLE)
    val browsers = packageManager.queryIntentActivities(browserIntent, PackageManager.MATCH_DEFAULT_ONLY)
    if (browsers.any { it.activityInfo.packageName == resolved.packageName }) return false

    intent.component = ComponentName(resolved.packageName, resolved.name)
    return true
  }
}
