package expo.modules.bottomsheet

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.core.view.allViews
import com.facebook.react.ReactRootView
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class BottomSheetView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {

  private var reactRootView: ReactRootView? = null
  private var innerView: View? = null
  private var dialog: BottomSheetDialog? = null

  private val onAttemptDismiss by EventDispatcher()
  private val onSnapPointChange by EventDispatcher()
  private val onStateChange by EventDispatcher()

  // Props
  var preventDismiss = false
    set(value) {
      field = value
      this.dialog?.setCancelable(!value)
    }
  var preventExpansion = false
  var minHeight = 0f
  var maxHeight = 0f

  private var isOpen: Boolean = false
    set(value) {
      field = value
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
        onStateChange(mapOf(
          "state" to "opening"
        ))
      }
    }

  private var isClosing: Boolean = false
    set(value) {
      field = value
      if (value) {
        onStateChange(mapOf(
          "state" to "closing"
        ))
      }
    }

  private var selectedSnapPoint = 0
    set(value) {
      if (field == value) return

      field = value
      onSnapPointChange(
        mapOf(
          "snapPoint" to value,
        ),
      )
    }

  // Lifecycle

  init {
    SheetManager.add(this)
  }

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
    this.present()
  }

  private fun destroy() {
    this.isClosing = false
    this.isOpen = false
    this.dialog = null
    this.reactRootView = null
    this.innerView = null
  }

  // Presentation

  private fun present() {
    val innerView = this.innerView ?: return
    val contentHeight = innerView.allViews.first().height.toFloat()

    // Needs to be a react root view for RNGH to work
    val rootView = ReactRootView(context)
    rootView.addView(innerView)
    this.reactRootView = rootView

    this.isOpening = true

    val dialog = BottomSheetDialog(context)
    dialog.setContentView(rootView)
    dialog.setCancelable(!preventDismiss)
    dialog.setOnShowListener {
      val bottomSheet = dialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
      bottomSheet?.let {
        // Let the outside view handle the background color on its own, the default for this is
        // white and we don't want that.
        it.setBackgroundColor(0)

        val behavior = BottomSheetBehavior.from(it)

        behavior.isFitToContents = false
        behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
        behavior.skipCollapsed = true
        behavior.isDraggable = true
        behavior.isHideable = true

        behavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onStateChanged(bottomSheet: View, newState: Int) {
            when (newState) {
              BottomSheetBehavior.STATE_EXPANDED -> {
                selectedSnapPoint = 2
              }
              BottomSheetBehavior.STATE_COLLAPSED -> {
                selectedSnapPoint = 1
              }
              BottomSheetBehavior.STATE_HALF_EXPANDED -> {
                selectedSnapPoint = 1
              }
              BottomSheetBehavior.STATE_HIDDEN -> {
                selectedSnapPoint = 0
              }
            }
          }

          override fun onSlide(bottomSheet: View, slideOffset: Float) { }
        })
      }
    }
    dialog.setOnDismissListener {
      this.isClosing = true
      this.destroy()
    }
    dialog.setOnCancelListener {
      it.cancel()
    }
    dialog.show()
    this.dialog = dialog
  }

  fun updateLayout() {
    this.innerView?.let {
      val contentHeight = it.allViews.first().height.toFloat()
    }
  }

  fun dismiss() {
    this.dialog?.dismiss()
    this.isClosing = true
    this.destroy()
  }
}
