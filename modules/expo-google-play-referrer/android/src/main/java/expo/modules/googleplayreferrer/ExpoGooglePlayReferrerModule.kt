package expo.modules.googleplayreferrer

import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoGooglePlayReferrerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGooglePlayReferrer")

    AsyncFunction("getReferrerInfoAsync") { promise: Promise ->
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
