package expo.modules.bottomsheet

import android.content.Context
import android.util.DisplayMetrics
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.Window
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.internal.EdgeToEdgeUtils
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * Fallback for Material's `material_bottom_sheet_max_width` dimen (in dp), used only
 * if the resource lookup fails. 640dp is the value Material ships.
 */
private const val FALLBACK_MAX_SHEET_WIDTH_DP = 640f

class BottomSheetView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  LifecycleEventListener {
  private var innerView: View? = null
  private var dialog: BottomSheetDialog? = null

  private lateinit var dialogRootViewGroup: DialogRootViewGroup
  private var eventDispatcher: EventDispatcher? = null

  // Native content height observation (eliminates JS bridge round-trip)
  private var contentLayoutListener: OnLayoutChangeListener? = null
  private var observedChildren: List<View> = emptyList()
  private var lastObservedContentHeight: Float = 0f
  private var pendingLayoutUpdate: Boolean = false

  // Computed per read rather than cached at construction: the RN activity handles
  // configuration changes itself, so a rotation resizes the display without
  // recreating this view and a cached value would stay stale for the sheet's life.
  private val screenHeight: Float
    get() =
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.VANILLA_ICE_CREAM) {
        // API 35+: edge-to-edge is mandatory, heightPixels is the full display
        context.resources.displayMetrics.heightPixels
          .toFloat()
      } else if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
        // API 30-34: heightPixels may exclude nav bar, use currentWindowMetrics
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as android.view.WindowManager
        wm.currentWindowMetrics.bounds
          .height()
          .toFloat()
      } else {
        // API < 30: currentWindowMetrics not available, use getRealSize
        // which includes system bars (heightPixels may exclude them)
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as android.view.WindowManager
        val size = android.graphics.Point()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getRealSize(size)
        size.y.toFloat()
      }

  private fun getNavigationBarHeight(): Int {
    val resourceId = resources.getIdentifier("navigation_bar_height", "dimen", "android")
    return if (resourceId > 0) resources.getDimensionPixelSize(resourceId) else 0
  }

  private fun getStatusBarHeight(): Int {
    val resourceId = resources.getIdentifier("status_bar_height", "dimen", "android")
    return if (resourceId > 0) resources.getDimensionPixelSize(resourceId) else 0
  }

  private val onAttemptDismiss by EventDispatcher()
  private val onSnapPointChange by EventDispatcher()
  private val onStateChange by EventDispatcher()

  // Last canvas size (in dp) pushed into the shadow tree, so repeated layout
  // passes don't spam state updates
  private var lastPushedCanvasWidth: Float = -1f
  private var lastPushedCanvasHeight: Float = -1f

  var disableDrag = false
    set(value) {
      field = value
      this.setDraggable(!value)
    }

  var preventDismiss = false
    set(value) {
      field = value
      this.dialog?.setCancelable(!value)
      // Full-height sheets have no half-expanded snap point, so any drag
      // would dismiss. Disable dragging when dismiss is prevented.
      if (fullHeight) {
        this.setDraggable(!value && !disableDrag)
      }
    }

  var fullHeight = false

  var preventExpansion = false

  var minHeight = 0f
    set(value) {
      field = if (value < 0) 0f else dpToPx(value)
    }

  // Stored unclamped (in px) because screenHeight can change under us on rotation.
  // The clamp against the screen happens at use time, in getTargetHeight().
  var maxHeight = Float.MAX_VALUE
    set(value) {
      field = dpToPx(value)
    }

  private var isOpen: Boolean = false
    set(value) {
      field = value
      onStateChange(mapOf("state" to if (value) "open" else "closed"))
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

  private var selectedSnapPoint = 0
    set(value) {
      if (field == value) return
      field = value
      onSnapPointChange(mapOf("snapPoint" to value))
    }

  init {
    (appContext.reactContext as? ReactContext)?.let {
      it.addLifecycleEventListener(this)
      this.eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(it, this.id)
      this.dialogRootViewGroup = DialogRootViewGroup(context)
      this.dialogRootViewGroup.eventDispatcher = this.eventDispatcher

      // The dialog container's measured WIDTH is the authoritative canvas width: it
      // already accounts for the window's horizontal insets, Material's max-width cap on
      // tablets and the current rotation. DialogRootViewGroup's own updateNodeSize() path
      // is a no-op on the new architecture (getNativeModule(UIManagerModule) returns null
      // under Fabric), so this state channel is what actually gets the width across there.
      //
      // Its measured HEIGHT is deliberately ignored - see canvasHeight.
      this.dialogRootViewGroup.setOnSizeChangeListener(
        object : DialogRootViewGroup.OnSizeChangeListener {
          override fun onSizeChange(
            width: Int,
            height: Int,
          ) {
            val density = context.resources.displayMetrics.density
            pushCanvasSize(width / density, canvasHeight / density)

            // onSizeChanged fires from inside a layout pass, so defer the reposition:
            // updateLayout() reads child heights that aren't final yet. This is what
            // makes the sheet settle back into place after a rotation. It no-ops for
            // fullHeight sheets, which is correct - those are pinned to the expanded
            // offset either way.
            if ((isOpen || isOpening) && !isClosing) {
              post {
                if ((isOpen || isOpening) && !isClosing) {
                  updateLayout()
                }
              }
            }
          }
        },
      )
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
    this.seedCanvasSize()
    this.present()
  }

  /**
   * The height, in px, of the canvas the sheet content is laid out on. This is the whole
   * expanded frame (the behavior's expandedOffset is the status bar height), NOT the
   * sheet's current height.
   *
   * That distinction is the whole ballgame. The content's height is what drives the snap
   * points, so the canvas has to be room to grow *into*. Sizing the canvas from the
   * dialog's own measured height is circular - BottomSheetBehavior measures the dialog
   * container against the sheet, so the canvas collapses onto the content height, and from
   * then on the content is pinned: extra ScrollView padding (the Android keyboard path) or
   * a longer list just becomes scroll extent instead of a height change, the
   * OnLayoutChangeListener never fires, and the sheet stops responding to its content.
   */
  private val canvasHeight: Float
    get() = screenHeight - getStatusBarHeight()

  /**
   * JS renders the sheet content unsized, so before the first state commit it measures
   * 0x0 and present() has no content height to derive snap points from. Seed the canvas
   * here to kick that off - the dialog container reports the authoritative width later,
   * via its OnSizeChangeListener.
   *
   * Runs at most once per open cycle. It has to: each state commit re-fires onLayout, so
   * re-seeding would fight the width the dialog reported and the two would push each other
   * back and forth forever.
   *
   * stateWrapper is assigned while Fabric mounts the view, before the first layout pass,
   * so setViewSize() should already reach the shadow tree from here. On the old
   * architecture it is null and this no-ops, which is fine: DialogRootViewGroup's legacy
   * updateNodeSize() path still sizes the content there.
   */
  private fun seedCanvasSize() {
    if (lastPushedCanvasWidth > 0f) return
    val density = context.resources.displayMetrics.density
    val widthPx =
      minOf(
        context.resources.displayMetrics.widthPixels
          .toFloat(),
        getMaxSheetWidth(),
      )
    this.pushCanvasSize(widthPx / density, canvasHeight / density)
  }

  /**
   * Sets the size of this view's shadow node, which is the canvas the sheet content is
   * laid out on. Deduped because both onLayout and the dialog container's size changes
   * can re-report an unchanged size.
   */
  private fun pushCanvasSize(
    widthDp: Float,
    heightDp: Float,
  ) {
    if (widthDp <= 0f || heightDp <= 0f) return
    if (widthDp == lastPushedCanvasWidth && heightDp == lastPushedCanvasHeight) return
    lastPushedCanvasWidth = widthDp
    lastPushedCanvasHeight = heightDp
    this.shadowNodeProxy.setViewSize(widthDp.toDouble(), heightDp.toDouble())
  }

  /**
   * Material caps the sheet frame at `material_bottom_sheet_max_width` (the
   * `android:maxWidth` on `Widget.MaterialComponents.BottomSheet`, which our dialog theme
   * inherits from) and centers it horizontally, so on tablets the sheet is narrower than
   * the display. Returns the cap in px.
   */
  private fun getMaxSheetWidth(): Float =
    try {
      resources
        .getDimensionPixelSize(com.google.android.material.R.dimen.material_bottom_sheet_max_width)
        .toFloat()
    } catch (e: android.content.res.Resources.NotFoundException) {
      FALLBACK_MAX_SHEET_WIDTH_DP * context.resources.displayMetrics.density
    }

  private fun destroy() {
    this.stopObservingContentHeight()
    this.isClosing = false
    this.isOpen = false
    this.dialog = null
    this.innerView = null
    SheetManager.remove(this)
  }

  // Presentation

  private fun getHalfExpandedRatio(contentHeight: Float): Float =
    when {
      // Full height sheets
      contentHeight >= screenHeight -> 0.99f

      else -> this.clampRatio(this.getTargetHeight() / screenHeight)
    }

  private fun present() {
    if (this.isOpen || this.isOpening || this.isClosing) return

    val contentHeight = this.getContentHeight()

    // The content is unsized until the canvas size we pushed lands in the shadow tree,
    // so bail and let this retry itself: the state commit resizes this view, that
    // re-fires onLayout, and onLayout re-enters present(). Full-height sheets don't
    // need a content measurement, so they can go ahead immediately.
    //
    // Only gate when there is a state channel to wait on. Without one (old architecture)
    // nothing would ever resize this view, and the sheet would never present.
    if (stateWrapper != null && !fullHeight && contentHeight <= 0f) return

    var activityWindow: Window? = null
    var currentContext = context
    while (currentContext != null) {
      if (currentContext is android.app.Activity) {
        activityWindow = currentContext.window
        break
      }
      currentContext = (currentContext as? android.content.ContextWrapper)?.baseContext
    }

    val originalStatusBarAppearance =
      activityWindow?.let { window ->
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars
      }
    val originalNavBarAppearance =
      activityWindow?.let { window ->
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightNavigationBars
      }

    val dialog = BottomSheetDialog(context, R.style.EdgeToEdgeBottomSheetDialogTheme)
    dialog.setContentView(dialogRootViewGroup)
    dialog.setCancelable(!preventDismiss)
    dialog.setDismissWithAnimation(true)
    dialog.setOnDismissListener {
      this.isClosing = true
      this.destroy()
    }

    dialog.setOnShowListener {
      dialog.window?.let { window ->
        val insetsController = WindowInsetsControllerCompat(window, window.decorView)
        if (originalNavBarAppearance != null) {
          insetsController.isAppearanceLightNavigationBars = originalNavBarAppearance
        }
        if (originalStatusBarAppearance != null) {
          EdgeToEdgeUtils.setLightStatusBar(window, originalStatusBarAppearance)
        }
      }
    }

    val bottomSheet = dialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
    bottomSheet?.let {
      it.setBackgroundColor(0)
      it.elevation = 0f

      val behavior = BottomSheetBehavior.from(it)
      behavior.state = BottomSheetBehavior.STATE_HIDDEN
      behavior.skipCollapsed = true
      behavior.isDraggable = true
      behavior.isHideable = true
      if (fullHeight) {
        behavior.isFitToContents = false
        behavior.expandedOffset = getStatusBarHeight()
        behavior.state = BottomSheetBehavior.STATE_EXPANDED
        this.selectedSnapPoint = 2
      } else if (preventExpansion) {
        behavior.isFitToContents = true
        behavior.halfExpandedRatio = getHalfExpandedRatio(contentHeight)
        behavior.maxHeight = (behavior.halfExpandedRatio * screenHeight).toInt()
        behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
        this.selectedSnapPoint = 1
      } else {
        behavior.isFitToContents = false
        behavior.halfExpandedRatio = getHalfExpandedRatio(contentHeight)
        behavior.expandedOffset = getStatusBarHeight()

        val targetHeight = this.getTargetHeight()
        val availableHeight = screenHeight - getStatusBarHeight() - getNavigationBarHeight()
        val shouldBeExpanded = targetHeight >= availableHeight

        if (shouldBeExpanded) {
          behavior.state = BottomSheetBehavior.STATE_EXPANDED
          this.selectedSnapPoint = 2
        } else {
          behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
          this.selectedSnapPoint = 1
        }
      }

      behavior.addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onStateChanged(
            bottomSheet: View,
            newState: Int,
          ) {
            if (newState == BottomSheetBehavior.STATE_EXPANDED && preventExpansion) {
              behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
              return
            }
            when (newState) {
              BottomSheetBehavior.STATE_EXPANDED -> selectedSnapPoint = 2
              BottomSheetBehavior.STATE_COLLAPSED -> selectedSnapPoint = 1
              BottomSheetBehavior.STATE_HALF_EXPANDED -> selectedSnapPoint = 1
              BottomSheetBehavior.STATE_HIDDEN -> selectedSnapPoint = 0
            }
            // Apply deferred layout update after gesture completes
            if (newState != BottomSheetBehavior.STATE_DRAGGING &&
              newState != BottomSheetBehavior.STATE_SETTLING &&
              pendingLayoutUpdate
            ) {
              pendingLayoutUpdate = false
              updateLayout()
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
    if (!fullHeight) {
      this.startObservingContentHeight()
    }
  }

  fun updateLayout() {
    if (fullHeight) return
    val dialog = this.dialog ?: return
    val contentHeight = this.getContentHeight()

    val bottomSheet = dialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
    bottomSheet?.let {
      val behavior = BottomSheetBehavior.from(it)
      val currentState = behavior.state

      val oldRatio = behavior.halfExpandedRatio
      val newRatio = getHalfExpandedRatio(contentHeight)

      val targetHeight = this.getTargetHeight()
      val availableHeight = screenHeight - getStatusBarHeight() - getNavigationBarHeight()
      val shouldBeExpanded = targetHeight >= availableHeight

      // Don't update during user gestures — defer until the gesture completes.
      if (currentState == BottomSheetBehavior.STATE_DRAGGING) {
        pendingLayoutUpdate = true
        return
      }

      behavior.halfExpandedRatio = newRatio

      if (preventExpansion) {
        behavior.maxHeight = (behavior.halfExpandedRatio * screenHeight).toInt()
        it.requestLayout()
      }

      // During settling (programmatic animation from our own state change),
      // redirect the animation to the new position if the ratio changed.
      if (currentState == BottomSheetBehavior.STATE_SETTLING) {
        if (oldRatio != newRatio) {
          behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
        }
        return
      }

      if (shouldBeExpanded && behavior.state != BottomSheetBehavior.STATE_EXPANDED && !preventExpansion) {
        behavior.state = BottomSheetBehavior.STATE_EXPANDED
      } else if (!shouldBeExpanded && behavior.state != BottomSheetBehavior.STATE_HALF_EXPANDED) {
        behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
      } else if (currentState == BottomSheetBehavior.STATE_HALF_EXPANDED && oldRatio != newRatio) {
        behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
      }
    }
  }

  fun dismiss() {
    val dialog = this.dialog ?: return
    // Mark as closing so the content observer doesn't fight the dismiss
    // animation by calling updateLayout() mid-hide.
    this.isClosing = true
    // Temporarily make cancelable so cancel() works — cancel() gives the
    // slide-out animation, while dismiss() does a plain fade.
    dialog.setCancelable(true)
    dialog.cancel()
  }

  // Observe each direct child of innerView via OnLayoutChangeListener so that
  // height updates are detected purely on the native side. We use OnLayoutChangeListener
  // (not OnGlobalLayoutListener) because React Native calls view.layout() directly
  // via Yoga, bypassing requestLayout()/performTraversals(). OnLayoutChangeListener
  // fires from setFrame() which IS called by layout(), so it catches RN updates.
  private fun startObservingContentHeight() {
    stopObservingContentHeight()

    val innerViewGroup = this.innerView as? ViewGroup ?: return

    val listener =
      OnLayoutChangeListener { _, _, top, _, bottom, _, _, oldTop, oldBottom ->
        val newHeight = bottom - top
        val oldHeight = oldBottom - oldTop
        if (newHeight != oldHeight) {
          val contentHeight = getContentHeight()
          if (contentHeight != lastObservedContentHeight && contentHeight > 0 && (isOpen || isOpening) && !isClosing) {
            lastObservedContentHeight = contentHeight
            updateLayout()
          }
        }
      }

    val children = mutableListOf<View>()
    for (i in 0 until innerViewGroup.childCount) {
      val child = innerViewGroup.getChildAt(i)
      child.addOnLayoutChangeListener(listener)
      children.add(child)
    }

    this.contentLayoutListener = listener
    this.observedChildren = children

    // Pick up current height if content is already laid out
    val contentHeight = getContentHeight()
    if (contentHeight > 0 && contentHeight != lastObservedContentHeight) {
      lastObservedContentHeight = contentHeight
      updateLayout()
    }
  }

  private fun stopObservingContentHeight() {
    contentLayoutListener?.let { listener ->
      observedChildren.forEach { it.removeOnLayoutChangeListener(listener) }
    }
    contentLayoutListener = null
    observedChildren = emptyList()
    lastObservedContentHeight = 0f
  }

  // Util

  private fun getContentHeight(): Float {
    val innerView = this.innerView as? ViewGroup ?: return 0f
    // Use the tallest direct child's height. The handle is absolutely positioned
    // (overlaps the content), so summing would double-count its height as padding.
    var maxChildHeight = 0f
    for (i in 0 until innerView.childCount) {
      val h = innerView.getChildAt(i).height.toFloat()
      if (h > maxChildHeight) maxChildHeight = h
    }
    return maxChildHeight
  }

  private fun getTargetHeight(): Float {
    val contentHeight = this.getContentHeight()
    // maxHeight is stored unclamped, so clamp it against the current screen here
    val effectiveMaxHeight = minOf(this.maxHeight, this.screenHeight)
    return when {
      contentHeight > effectiveMaxHeight -> effectiveMaxHeight
      contentHeight < minHeight -> minHeight
      else -> contentHeight
    }
  }

  private fun clampRatio(ratio: Float): Float =
    when {
      ratio < 0.01 -> 0.01f
      ratio > 0.99 -> 0.99f
      else -> ratio
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
    if (structure == null) return
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
    return dp * (displayMetrics.xdpi / DisplayMetrics.DENSITY_DEFAULT)
  }
}
