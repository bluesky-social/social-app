package expo.modules.getreferrer

import android.content.Intent
import android.net.Uri
import android.os.Build
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoGetReferrerModule : Module() {
  private var intent: Intent? = null
  private var referrer: Uri? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoGetReferrer")

    OnNewIntent {
      intent = it
      referrer = appContext.currentActivity?.referrer
    }

    AsyncFunction("getReferrerInfoAsync") {
      val intentReferrer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent?.getParcelableExtra(Intent.EXTRA_REFERRER, Uri::class.java)
      } else {
        intent?.getParcelableExtra(Intent.EXTRA_REFERRER)
      }

      // Some apps explicitly set a referrer, like Chrome. In these cases, we prefer this since
      // it's the actual website that the user came from rather than the app.
      if (intentReferrer is Uri) {
        return@AsyncFunction mapOf(
          "referrer" to intentReferrer.toString(),
          "hostname" to intentReferrer.host,
        )
      }

      // In all other cases, we'll just record the app that sent the intent.
      if (referrer != null) {
        // referrer could become null here. `.toString()` though can be called on null
        return@AsyncFunction mapOf(
          "referrer" to referrer.toString(),
          "hostname" to (referrer?.host ?: ""),
        )
      }

      return@AsyncFunction null
    }

    AsyncFunction("getGooglePlayReferrerInfoAsync") { promise: Promise ->
      val referrerClient = InstallReferrerClient.newBuilder(appContext.reactContext).build()
      referrerClient.startConnection(object : InstallReferrerStateListener {
        override fun onInstallReferrerSetupFinished(responseCode: Int) {
          if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
            val response = referrerClient.installReferrer
            promise.resolve(
              mapOf(
                "installReferrer" to response.installReferrer,
                "clickTimestamp" to response.referrerClickTimestampSeconds,
                "installTimestamp" to response.installBeginTimestampSeconds
              )
            )
          } else {
            promise.reject(
              "ERR_GOOGLE_PLAY_REFERRER_UNKNOWN",
              "Failed to get referrer info",
              Exception("Failed to get referrer info")
            )
          }
          referrerClient.endConnection()
        }

        override fun onInstallReferrerServiceDisconnected() {
          promise.reject(
            "ERR_GOOGLE_PLAY_REFERRER_DISCONNECTED",
            "Failed to get referrer info",
            Exception("Failed to get referrer info")
          )
          referrerClient.endConnection()
        }
      })
    }
  }
}
