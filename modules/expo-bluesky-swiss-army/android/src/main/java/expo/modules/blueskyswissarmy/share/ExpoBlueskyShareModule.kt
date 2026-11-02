package expo.modules.blueskyswissarmy.share

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Opens the system share sheet like React Native's `Share.share()`, but also
 * reports which app the user picked. RN's version resolves as soon as the
 * sheet opens and can't tell us that.
 */
class ExpoBlueskyShareModule : Module() {
  private var pendingPromise: Promise? = null
  private var receiver: BroadcastReceiver? = null
  private val handler = Handler(Looper.getMainLooper())
  private val dismissRunnable = Runnable { settle(null) }

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val chosenAction: String
    get() = "${context.packageName}.SHARE_TARGET_CHOSEN"

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyShare")

      AsyncFunction("shareText") { text: String, promise: Promise ->
        // A previous share sheet that never reported back counts as dismissed
        settle(null)

        val sendIntent =
          Intent(Intent.ACTION_SEND).apply {
            setTypeAndNormalize("text/plain")
            putExtra(Intent.EXTRA_TEXT, text)
          }

        var flags = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          // The system fills in EXTRA_CHOSEN_COMPONENT, so this must be mutable
          flags = flags or PendingIntent.FLAG_MUTABLE
        }
        val callback =
          PendingIntent.getBroadcast(
            context,
            0,
            Intent(chosenAction).setPackage(context.packageName),
            flags,
          )

        val chooser =
          Intent.createChooser(sendIntent, null, callback.intentSender).apply {
            addCategory(Intent.CATEGORY_DEFAULT)
          }

        registerReceiverIfNeeded()
        pendingPromise = promise

        val activity = appContext.currentActivity
        try {
          if (activity != null) {
            activity.startActivity(chooser)
          } else {
            context.startActivity(chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
          }
        } catch (e: Exception) {
          pendingPromise = null
          promise.reject("E_UNABLE_TO_OPEN_DIALOG", "Failed to open share dialog", e)
        }
      }.runOnQueue(Queues.MAIN)

      /*
       * Android doesn't report a dismissed chooser, so treat returning to the
       * app without a reported pick as dismissed. The delay gives the pick
       * broadcast time to arrive first.
       */
      OnActivityEntersForeground {
        if (pendingPromise != null) {
          handler.removeCallbacks(dismissRunnable)
          handler.postDelayed(dismissRunnable, 500)
        }
      }

      OnDestroy {
        handler.removeCallbacks(dismissRunnable)
        settle(null)
        receiver?.let {
          try {
            context.unregisterReceiver(it)
          } catch (_: Exception) {
          }
        }
        receiver = null
      }
    }

  private fun registerReceiverIfNeeded() {
    if (receiver != null) return
    val r =
      object : BroadcastReceiver() {
        override fun onReceive(
          ctx: Context,
          intent: Intent,
        ) {
          // The typed getter is buggy on Android 13; AndroidX's IntentCompat only uses it on 14+
          val component =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
              intent.getParcelableExtra(Intent.EXTRA_CHOSEN_COMPONENT, ComponentName::class.java)
            } else {
              @Suppress("DEPRECATION")
              intent.getParcelableExtra(Intent.EXTRA_CHOSEN_COMPONENT)
            }
          settle(component?.packageName)
        }
      }
    val filter = IntentFilter(chosenAction)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(r, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      context.registerReceiver(r, filter)
    }
    receiver = r
  }

  /**
   * Resolves the pending share, if any. A null target means no app was
   * reported, which includes the chooser's own actions like Copy.
   */
  private fun settle(target: String?) {
    val promise = pendingPromise ?: return
    pendingPromise = null
    handler.removeCallbacks(dismissRunnable)
    if (target != null) {
      promise.resolve(mapOf("action" to "sharedAction", "target" to target))
    } else {
      promise.resolve(mapOf("action" to "dismissedAction"))
    }
  }
}
