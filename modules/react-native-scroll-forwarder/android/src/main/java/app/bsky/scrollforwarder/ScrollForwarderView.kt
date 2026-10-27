package app.bsky.scrollforwarder

import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.NativeGestureUtil
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.swiperefresh.ReactSwipeRefreshLayout
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.abs

/** Hands vertical header drags to the focused list's native touch handling. */
class ScrollForwarderView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {
  var scrollViewTag: Int = -1
    set(value) {
      if (field != value) finishGesture()
      field = value
    }

  private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
  private var down: MotionEvent? = null
  private val pointerChanges = mutableListOf<MotionEvent>()
  private var lastForwarded: MotionEvent? = null
  private var target: ReactScrollView? = null
  private var refreshTarget: ReactSwipeRefreshLayout? = null
  private var refreshIntercepted = false
  private var horizontal = false
  private var originX = 0f
  private var originY = 0f
  private var refreshOffsetX = 0f
  private var refreshOffsetY = 0f

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      finishGesture()
      down = MotionEvent.obtain(event)
      horizontal = false
    }

    val initial = down
    if (target == null && !horizontal && initial != null) {
      when (event.actionMasked) {
        MotionEvent.ACTION_POINTER_DOWN, MotionEvent.ACTION_POINTER_UP -> {
          /* Replay pointer transitions too, including TalkBack's two-finger scrolls. */
          pointerChanges.add(MotionEvent.obtain(event))
          if (event.actionMasked == MotionEvent.ACTION_POINTER_UP &&
              event.getPointerId(event.actionIndex) == initial.getPointerId(0)) {
            horizontal = true
          }
        }
        MotionEvent.ACTION_MOVE -> {
          val pointerIndex = event.findPointerIndex(initial.getPointerId(0))
          if (pointerIndex >= 0) {
            val rawX = event.getX(pointerIndex) + event.rawX - event.x
            val rawY = event.getY(pointerIndex) + event.rawY - event.y
            val dx = abs(rawX - initial.rawX)
            val dy = abs(rawY - initial.rawY)
            if (dx > touchSlop && dx >= dy) {
              horizontal = true
            } else if (dy > touchSlop && dy > dx) {
              resolveScrollView()?.let { beginGesture(it, initial, event) }
            }
          }
        }
      }
    }

    if (target != null) {
      forward(event)
      if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
        finishGesture(cancelTarget = false)
      }
      return true
    }

    val handled = super.dispatchTouchEvent(event)
    if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
      finishGesture(cancelTarget = false)
    }
    return handled
  }

  private fun beginGesture(scroll: ReactScrollView, initial: MotionEvent, event: MotionEvent) {
    val content = scroll.getChildAt(0) ?: return
    if (!scroll.isAttachedToWindow || !scroll.scrollEnabled || content.width <= 0 || content.height <= 0) return

    val location = IntArray(2)
    scroll.getLocationOnScreen(location)
    originX = (initial.rawX - location[0]).coerceIn(
      content.left.toFloat(), (content.right - 1).toFloat())
    /*
     * DOWN in the list's reserved header padding cannot start a native drag.
     * Replay inside content, even when the overlaid header exceeds the viewport.
     */
    originY = maxOf(initial.rawY - location[1],
      (content.top - scroll.scrollY + touchSlop + 1).toFloat())
      .coerceAtMost((content.bottom - scroll.scrollY - 1).toFloat())

    val cancel = MotionEvent.obtain(event)
    cancel.action = MotionEvent.ACTION_CANCEL
    super.dispatchTouchEvent(cancel)
    cancel.recycle()

    target = scroll
    refreshTarget = scroll.parent as? ReactSwipeRefreshLayout
    refreshIntercepted = false
    refreshTarget?.let { refresh ->
      val refreshLocation = IntArray(2)
      refresh.getLocationOnScreen(refreshLocation)
      refreshOffsetX = (location[0] - refreshLocation[0]).toFloat()
      refreshOffsetY = (location[1] - refreshLocation[1]).toFloat()
    }
    NativeGestureUtil.notifyNativeGestureStarted(this, event)
    parent?.requestDisallowInterceptTouchEvent(true)
    val changes = pointerChanges.toList()
    pointerChanges.clear()
    forward(initial)
    for (change in changes) {
      forward(change)
      change.recycle()
    }
  }

  private fun forward(event: MotionEvent) {
    val scroll = target ?: return
    val initial = down ?: return
    if (!scroll.isAttachedToWindow) {
      finishGesture()
      return
    }
    val forwarded = MotionEvent.obtain(event)
    /* Preserve every pointer's screen position as scrolling translates the header. */
    forwarded.setLocation(originX + event.rawX - initial.rawX, originY + event.rawY - initial.rawY)
    lastForwarded?.recycle()
    lastForwarded = MotionEvent.obtain(forwarded)

    val refresh = refreshTarget
    if (refresh != null) {
      val refreshEvent = MotionEvent.obtain(forwarded)
      refreshEvent.offsetLocation(refreshOffsetX, refreshOffsetY)
      if (!refreshIntercepted && refresh.onInterceptTouchEvent(refreshEvent)) {
        refreshIntercepted = true
        val cancel = MotionEvent.obtain(forwarded)
        cancel.action = MotionEvent.ACTION_CANCEL
        scroll.dispatchTouchEvent(cancel)
        cancel.recycle()
      }
      if (refreshIntercepted) refresh.onTouchEvent(refreshEvent)
      refreshEvent.recycle()
    }
    /*
     * Dispatch directly: the refresh wrapper's child hit test would discard DOWN
     * when the content begins below its viewport. Its interceptor above still
     * owns pull-to-refresh, just as in normal ViewGroup touch dispatch.
     */
    if (!refreshIntercepted) scroll.dispatchTouchEvent(forwarded)
    forwarded.recycle()
  }

  internal fun finishGesture(cancelTarget: Boolean = true) {
    val scroll = target
    val refresh = refreshTarget
    val wasRefreshing = refreshIntercepted
    val last = lastForwarded
    /* Clear ownership before dispatching cancellation, which can reenter via unmount. */
    target = null
    refreshTarget = null
    refreshIntercepted = false
    lastForwarded = null
    down?.recycle()
    down = null
    recyclePointerChanges()

    if (scroll != null && last != null) {
      if (cancelTarget) {
        val cancel = MotionEvent.obtain(last)
        cancel.action = MotionEvent.ACTION_CANCEL
        if (refresh != null) {
          val refreshCancel = MotionEvent.obtain(cancel)
          refreshCancel.offsetLocation(refreshOffsetX, refreshOffsetY)
          if (wasRefreshing) refresh.onTouchEvent(refreshCancel)
          else refresh.onInterceptTouchEvent(refreshCancel)
          refreshCancel.recycle()
        }
        if (!wasRefreshing) scroll.dispatchTouchEvent(cancel)
        cancel.recycle()
      }
      NativeGestureUtil.notifyNativeGestureEnded(this, last)
      parent?.requestDisallowInterceptTouchEvent(false)
    }
    last?.recycle()
  }

  private fun recyclePointerChanges() {
    for (change in pointerChanges) change.recycle()
    pointerChanges.clear()
  }

  private fun resolveScrollView(): ReactScrollView? {
    if (scrollViewTag <= 0) return null
    val manager = UIManagerHelper.getUIManagerForReactTag(reactContext, scrollViewTag) ?: return null
    return try {
      findScrollView(manager.resolveView(scrollViewTag))
    } catch (_: IllegalViewOperationException) {
      // A tab or navigation transition can unmount the last reported list.
      null
    }
  }

  private fun findScrollView(view: View?): ReactScrollView? {
    if (view is ReactScrollView) return view
    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        val scroll = findScrollView(view.getChildAt(index))
        if (scroll != null) return scroll
      }
    }
    return null
  }

  override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
    if (!hasWindowFocus) finishGesture()
    super.onWindowFocusChanged(hasWindowFocus)
  }

  override fun onDetachedFromWindow() {
    finishGesture()
    super.onDetachedFromWindow()
  }
}
