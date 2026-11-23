package expo.modules.blueskyswissarmy.referrer

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ExpoBlueskyReferrerModule : Module() {
  private var intent: Intent? = null
  private var activityReferrer: Uri? = null

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyReferrer")

      OnNewIntent {
        intent = it
        activityReferrer = appContext.currentActivity?.referrer
      }

      Function("getReferrerInfo") {
        val intentReferrer =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent?.getParcelableExtra(Intent.EXTRA_REFERRER, Uri::class.java)
          } else {
            intent?.getParcelableExtra(Intent.EXTRA_REFERRER)
          }

        // Some apps explicitly set a referrer, like Chrome. In these cases, we prefer this since
        // it's the actual website that the user came from rather than the app.
        if (intentReferrer is Uri) {
          val res =
            mapOf(
              "referrer" to intentReferrer.toString(),
              "hostname" to intentReferrer.host,
            )
          intent = null
          return@Function res
        }

        // In all other cases, we'll just record the app that sent the intent.
        if (activityReferrer != null) {
          // referrer could become null here. `.toString()` though can be called on null
          val res =
            mapOf(
              "referrer" to activityReferrer.toString(),
              "hostname" to (activityReferrer?.host ?: ""),
            )
          activityReferrer = null
          return@Function res
        }

        return@Function null
      }

      AsyncFunction("getGooglePlayReferrerInfoAsync") { promise: Promise ->
        val referrerClient = InstallReferrerClient.newBuilder(appContext.reactContext).build()
        referrerClient.startConnection(
          object : InstallReferrerStateListener {
            override fun onInstallReferrerSetupFinished(responseCode: Int) {
              if (responseCode != InstallReferrerClient.InstallReferrerResponse.OK) {
                Log.d("ExpoGooglePlayReferrer", "Failed to get referrer info. Unknown error.")
                promise.reject(
                  "ERR_GOOGLE_PLAY_REFERRER_UNKNOWN",
                  "Failed to get referrer info",
                  Exception("Failed to get referrer info"),
                )
                referrerClient.endConnection()
                return
              }

              /*
               * Reading the referrer is a blocking IPC call into the Play Store, and this
               * callback runs on the main thread, so make the call in the background. It
               * throws if the Play Store dies or refuses the call partway through. Settle
               * the promise and disconnect back on the main thread so this can't race with
               * onInstallReferrerServiceDisconnected, which fires when the Play Store dies.
               */
              appContext.backgroundCoroutineScope.launch {
                val result =
                  runCatching {
                    val response = referrerClient.installReferrer
                    mapOf(
                      "installReferrer" to response.installReferrer,
                      "clickTimestamp" to response.referrerClickTimestampSeconds,
                      "installTimestamp" to response.installBeginTimestampSeconds,
                    )
                  }

                withContext(Dispatchers.Main) {
                  result
                    .onSuccess {
                      Log.d("ExpoGooglePlayReferrer", "Install referrer: ${it["installReferrer"]}")
                      promise.resolve(it)
                    }.onFailure {
                      Log.d("ExpoGooglePlayReferrer", "Failed to get referrer info.", it)
                      promise.reject(
                        "ERR_GOOGLE_PLAY_REFERRER_FAILED",
                        "Failed to get referrer info",
                        it,
                      )
                    }
                  referrerClient.endConnection()
                }
              }
            }

            override fun onInstallReferrerServiceDisconnected() {
              Log.d("ExpoGooglePlayReferrer", "Failed to get referrer info. Service disconnected.")
              referrerClient.endConnection()
              promise.reject(
                "ERR_GOOGLE_PLAY_REFERRER_DISCONNECTED",
                "Failed to get referrer info",
                Exception("Failed to get referrer info"),
              )
            }
          },
        )
      }
    }
}
