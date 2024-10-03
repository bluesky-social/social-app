package expo.modules.bottomsheet

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.ComposeView
import androidx.core.view.allViews
import com.facebook.react.ReactRootView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class BottomSheetView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  val sheetState = mutableStateOf(SheetState())

  private var reactRootView: ReactRootView? = null
  private var innerView: View? = null

  private var sheetView: ComposeView? = null

  private val onStateChange by EventDispatcher()
  private val onAttemptDismiss by EventDispatcher()

  // Props
  var preventDismiss = false
  var minHeight = 0f
  var maxHeight = 0f

  private var isOpen: Boolean = false
    set(value) {
      if (field == value) return

      field = value
      this.sheetState.value.isOpen = value
      onStateChange(
        mapOf(
          "state" to if (value) "open" else "closed",
        ),
      )
    }

  private var isOpening: Boolean = false
    set(value) {
      field = value
      if (value) {
        onStateChange(mapOf("state" to "opening"))
      }
    }

  private var isClosing: Boolean = false
    set(value) {
      field = value
      if (value) {
        onStateChange(mapOf("state" to "closing"))
      }
    }

  private var hasInitiallyOpened = false

  // Lifecycle

  override fun addView(
    child: View?,
    index: Int,
  ) {
    this.innerView = child
  }

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int,
  ) {
    this.innerView?.let {
      val height =
        it.allViews
          .last()
          .measuredHeight
          .toFloat()
      this.present(height)
    }
  }

  private fun destroy() {
    this.isClosing = false
    this.isOpen = false

    this.getRootLayout().removeView(this.sheetView)
    this.sheetView = null

    this.reactRootView = null
    this.innerView = null
  }

  // Presentation

  private fun present(contentHeight: Float) {
    val innerView = this.innerView ?: return

    // For GestureRootView to work, we need to create a ReactRootView for the innerView to be
    // contained inside of
    val reactRootView = ReactRootView(context)
    reactRootView.addView(innerView)
    this.reactRootView = reactRootView

    this.isOpening = true
    this.sheetView =
      ComposeView(context).also {
        it.setContent {
          SheetView(
            state = sheetState,
            innerView = reactRootView,
            contentHeight = innerView.height.toFloat(),
            onDismissRequest = {
              onAttemptDismiss(mapOf())
              if (!preventDismiss) {
                dismiss()
              }
            },
            onExpanded = {
              isOpening = false
              isOpen = true
              hasInitiallyOpened = true
            },
            onHidden = {
              if (hasInitiallyOpened) {
                destroy()
              }
            },
          )
        }
        getRootLayout().addView(it)
      }
  }

  fun dismiss() {
    this.isClosing = true
    this.destroy()
  }

  // Utils

  private fun getRootLayout(): FrameLayout = appContext.currentActivity!!.findViewById(android.R.id.content)
}
