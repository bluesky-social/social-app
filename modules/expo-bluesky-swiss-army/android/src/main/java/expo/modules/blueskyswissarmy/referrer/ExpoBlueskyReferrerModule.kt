package expo.modules.blueskyswissarmy.referrer

import android.util.Log
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoBlueskyReferrerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlueskyReferrer")

    AsyncFunction("getGooglePlayReferrerInfoAsync") { promise: Promise ->
      val referrerClient = InstallReferrerClient.newBuilder(appContext.reactContext).build()
      referrerClient.startConnection(object : InstallReferrerStateListener {
        override fun onInstallReferrerSetupFinished(responseCode: Int) {
          if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
            Log.d("ExpoGooglePlayReferrer", "Successfully retrieved referrer info.")

            val response = referrerClient.installReferrer
            Log.d("ExpoGooglePlayReferrer", "Install referrer: ${response.installReferrer}")

            promise.resolve(
              mapOf(
                "installReferrer" to response.installReferrer,
                "clickTimestamp" to response.referrerClickTimestampSeconds,
                "installTimestamp" to response.installBeginTimestampSeconds
              )
            )
          } else {
            Log.d("ExpoGooglePlayReferrer", "Failed to get referrer info. Unknown error.")
            promise.reject(
              "ERR_GOOGLE_PLAY_REFERRER_UNKNOWN",
              "Failed to get referrer info",
              Exception("Failed to get referrer info")
            )
          }
          referrerClient.endConnection()
        }

        override fun onInstallReferrerServiceDisconnected() {
          Log.d("ExpoGooglePlayReferrer", "Failed to get referrer info. Service disconnected.")
          referrerClient.endConnection()
          promise.reject(
            "ERR_GOOGLE_PLAY_REFERRER_DISCONNECTED",
            "Failed to get referrer info",
            Exception("Failed to get referrer info")
          )
        }
      })
    }
  }
}