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

  private val screenHeight = context.resources.displayMetrics.heightPixels.toFloat()

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
    set (value) {
      field = if (value < 0) {
        0f
      } else {
        value
      }
    }

  var maxHeight = this.screenHeight
    set (value) {
      field = if (value > this.screenHeight) {
        this.screenHeight.toFloat()
      } else {
        value
      }
    }

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
    SheetManager.remove(this)
  }

  // Presentation

  private fun present() {
    if (this.isOpen || this.isOpening || this.isClosing) return

    val innerView = this.innerView ?: return
    val contentHeight = this.getContentHeight()

    // Needs to be a react root view for RNGH to work
    val rootView = ReactRootView(context)
    rootView.addView(innerView)
    this.reactRootView = rootView

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

        behavior.isFitToContents = true
        behavior.halfExpandedRatio = this.clampRatio(this.getTargetHeight() / this.screenHeight)
        if (contentHeight > this.screenHeight) {
          behavior.state = BottomSheetBehavior.STATE_EXPANDED
          this.selectedSnapPoint = 2
        } else {
          behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
          this.selectedSnapPoint = 1
        }
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

    this.isOpening = true
    dialog.show()
    this.dialog = dialog
  }

  fun updateLayout() {
    val dialog = this.dialog ?: return
    val contentHeight = this.getContentHeight()

    val bottomSheet = dialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
    bottomSheet?.let {
      val behavior = BottomSheetBehavior.from(it)

      behavior.halfExpandedRatio = this.clampRatio(this.getTargetHeight() / this.screenHeight)

      if (contentHeight > this.screenHeight && behavior.state != BottomSheetBehavior.STATE_EXPANDED) {
        behavior.state = BottomSheetBehavior.STATE_EXPANDED
      } else if (contentHeight < this.screenHeight && behavior.state != BottomSheetBehavior.STATE_HALF_EXPANDED) {
        behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
      }
    }
  }

  fun dismiss() {
    this.dialog?.dismiss()
  }

  // Util

  private fun getContentHeight(): Float {
    val innerView = this.innerView ?: return 0f
    innerView.allViews.forEach {
      if (it.javaClass.simpleName == "RNGestureHandlerRootView") {
        return it.height.toFloat() + 50f
      }
    }
    return 0f
  }

  private fun getTargetHeight(): Float {
    val contentHeight = this.getContentHeight()
    val height = if (contentHeight > maxHeight) {
      maxHeight
    } else if (contentHeight < minHeight) {
      minHeight
    } else {
      contentHeight
    }
    return height
  }

  private fun clampRatio(ratio: Float): Float {
    if (ratio < 0.01) {
      return 0.01f
    } else if (ratio > 0.99) {
      return 0.99f
    }
    return ratio
  }
}
