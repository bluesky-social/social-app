package expo.modules.bottomsheet

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import android.view.View
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

// SEE https://github.com/facebook/react-native/blob/309cdea337101cfe2212cfb6abebf1e783e43282/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L378

/**
 * DialogRootViewGroup is the ViewGroup which contains all the children of a Modal. It gets all
 * child information forwarded from [ReactModalHostView] and uses that to create children. It is
 * also responsible for acting as a RootView and handling touch events. It does this the same way
 * as ReactRootView.
 *
 * To get layout to work properly, we need to layout all the elements within the Modal as if they
 * can fill the entire window. To do that, we need to explicitly set the styleWidth and
 * styleHeight on the LayoutShadowNode to be the window size. This is done through the
 * UIManagerModule, and will then cause the children to layout as if they can fill the window.
 */
class DialogRootViewGroup(
  private val context: Context?,
) : ReactViewGroup(context),
  RootView {
  private var hasAdjustedSize = false
  private var viewWidth = 0
  private var viewHeight = 0

  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null
  private var sizeChangeListener: OnSizeChangeListener? = null

  var eventDispatcher: EventDispatcher? = null

  interface OnSizeChangeListener {
    fun onSizeChange(
      width: Int,
      height: Int,
    )
  }

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jSPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  override fun onSizeChanged(
    w: Int,
    h: Int,
    oldw: Int,
    oldh: Int,
  ) {
    super.onSizeChanged(w, h, oldw, oldh)

    viewWidth = w
    viewHeight = h
    updateFirstChildView()

    sizeChangeListener?.onSizeChange(w, h)
  }

  fun setOnSizeChangeListener(listener: OnSizeChangeListener) {
    sizeChangeListener = listener
  }

  private fun updateFirstChildView() {
    if (childCount > 0) {
      hasAdjustedSize = false
      val viewTag = getChildAt(0).id
      reactContext.runOnNativeModulesQueueThread(
        object : GuardedRunnable(reactContext) {
          override fun runGuarded() {
            val uiManager: UIManagerModule =
              reactContext
                .reactApplicationContext
                .getNativeModule(UIManagerModule::class.java) ?: return

            uiManager.updateNodeSize(viewTag, viewWidth, viewHeight)
          }
        },
      )
    } else {
      hasAdjustedSize = true
    }
  }

  override fun addView(
    child: View,
    index: Int,
    params: LayoutParams,
  ) {
    super.addView(child, index, params)
    if (hasAdjustedSize) {
      updateFirstChildView()
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSTouchDispatcher.handleTouchEvent(event, it) }
    jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
    return super.onInterceptTouchEvent(event)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSTouchDispatcher.handleTouchEvent(event, it) }
    jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
    super.onTouchEvent(event)

    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildStartedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
  }

  override fun onChildEndedNativeGesture(
    childView: View,
    ev: MotionEvent,
  ) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // No-op - override in order to still receive events to onInterceptTouchEvent
    // even when some other view disallow that
  }
}
