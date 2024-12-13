package expo.modules.bottomsheet

import android.content.Context
import android.util.DisplayMetrics
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import androidx.core.view.allViews
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView


class BottomSheetView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  LifecycleEventListener {
  private var innerView: View? = null
  private var dialog: BottomSheetDialog? = null

  private lateinit var dialogRootViewGroup: DialogRootViewGroup
  private var eventDispatcher: EventDispatcher? = null

  private val screenHeight =
    context.resources.displayMetrics.heightPixels
      .toFloat()

  private val onAttemptDismiss by EventDispatcher()
  private val onSnapPointChange by EventDispatcher()
  private val onStateChange by EventDispatcher()

  // Props
  var disableDrag = false
    set (value) {
      field = value
      this.setDraggable(!value)
    }

  var preventDismiss = false
    set(value) {
      field = value
      this.dialog?.setCancelable(!value)
    }
  var preventExpansion = false

  var minHeight = 0f
    set(value) {
      field =
        if (value < 0) {
          0f
        } else {
          dpToPx(value)
        }
    }

  var maxHeight = this.screenHeight
    set(value) {
      val px = dpToPx(value)
      field =
        if (px > this.screenHeight) {
          this.screenHeight
        } else {
          px
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
        onStateChange(
          mapOf(
            "state" to "opening",
          ),
        )
      }
    }

  private var isClosing: Boolean = false
    set(value) {
      field = value
      if (value) {
        onStateChange(
          mapOf(
            "state" to "closing",
          ),
        )
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
    (appContext.reactContext as? ReactContext)?.let {
      it.addLifecycleEventListener(this)
      this.eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(it, this.id)

      this.dialogRootViewGroup = DialogRootViewGroup(context)
      this.dialogRootViewGroup.eventDispatcher = this.eventDispatcher
    }
    SheetManager.add(this)
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
    this.innerView = null
    SheetManager.remove(this)
  }

  // Presentation

  private fun present() {
    if (this.isOpen || this.isOpening || this.isClosing) return

    val contentHeight = this.getContentHeight()
    val dialog = BottomSheetDialog(context)
    dialog.setContentView(dialogRootViewGroup)
    dialog.setCancelable(!preventDismiss)
    dialog.setOnDismissListener {
      this.isClosing = true
      this.destroy()
    }

    val bottomSheet = dialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
    bottomSheet?.let {
      it.setBackgroundColor(0)

      val behavior = BottomSheetBehavior.from(it)
      behavior.state = BottomSheetBehavior.STATE_HIDDEN
      behavior.isFitToContents = true
      behavior.halfExpandedRatio = this.clampRatio(this.getTargetHeight() / this.screenHeight)
      behavior.skipCollapsed = true
      behavior.isDraggable = true
      behavior.isHideable = true

      if (contentHeight >= this.screenHeight || this.minHeight >= this.screenHeight) {
        behavior.state = BottomSheetBehavior.STATE_EXPANDED
        this.selectedSnapPoint = 2
      } else {
        behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
        this.selectedSnapPoint = 1
      }

      behavior.addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onStateChanged(
            bottomSheet: View,
            newState: Int,
          ) {
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

          override fun onSlide(
            bottomSheet: View,
            slideOffset: Float,
          ) { }
        },
      )
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
    var index = 0
    innerView.allViews.forEach {
      if (index == 1) {
        return it.height.toFloat()
      }
      index++
    }
    return 0f
  }

  private fun getTargetHeight(): Float {
    val contentHeight = this.getContentHeight()
    val height =
      if (contentHeight > maxHeight) {
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

  private fun setDraggable(draggable: Boolean) {
    val dialog = this.dialog ?: return
    val bottomSheet = dialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
    bottomSheet?.let {
      val behavior = BottomSheetBehavior.from(it)
      behavior.isDraggable = draggable
    }
  }

  override fun onHostResume() { }

  override fun onHostPause() { }

  override fun onHostDestroy() {
    (appContext.reactContext as? ReactContext)?.let {
      it.removeLifecycleEventListener(this)
      this.destroy()
    }
  }

  // View overrides to pass to DialogRootViewGroup instead

  override fun dispatchProvideStructure(structure: ViewStructure?) {
    dialogRootViewGroup.dispatchProvideStructure(structure)
  }

  override fun setId(id: Int) {
    super.setId(id)
    dialogRootViewGroup.id = id
  }

  override fun addView(
    child: View?,
    index: Int,
  ) {
    this.innerView = child
    (child as ViewGroup).let {
      dialogRootViewGroup.addView(child, index)
    }
  }

  override fun removeView(view: View?) {
    UiThreadUtil.assertOnUiThread()
    if (view != null) {
      dialogRootViewGroup.removeView(view)
    }
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    dialogRootViewGroup.removeView(child)
  }

  override fun addChildrenForAccessibility(outChildren: ArrayList<View>?) { }

  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent?): Boolean = false

  // https://stackoverflow.com/questions/11862391/getheight-px-or-dpi
  fun dpToPx(dp: Float): Float {
    val displayMetrics = context.resources.displayMetrics
    val px = dp * (displayMetrics.xdpi / DisplayMetrics.DENSITY_DEFAULT)
    return px
  }
}
