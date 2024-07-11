package expo.modules.blueskyswissarmy.visibilityview

import android.content.Context
import android.graphics.Rect
import android.util.Log
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

const val TAG = "VisibilityView"

class VisibilityView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private val onVisibleChange by EventDispatcher()

  private var isCurrentlyActive = false

  var _enabled: Boolean = false

  override fun onAttachedToWindow() {
    Log.d(TAG, "onAttachedToWindow")
    super.onAttachedToWindow()
    VisibilityViewManager.addView(this)
  }

  override fun onDetachedFromWindow() {
    Log.d(TAG, "onDetachedFromWindow")
    super.onDetachedFromWindow()
    onVisibleChange(mapOf("visible" to false))
    VisibilityViewManager.removeView(this)
  }

  fun getScreenPosition(): Rect? {
    Log.d(TAG, "getScreenPosition")
    if (this.isShown) {
      val screenPosition = intArrayOf(0, 0)
      this.getLocationInWindow(screenPosition)
      return Rect(
        screenPosition[0],
        screenPosition[1],
        screenPosition[0] + this.width,
        screenPosition[1] + this.height,
      )
    }
    return null
  }

  fun setCurrentlyActive(isActive: Boolean) {
    Log.d(TAG, "setCurrentlyActive")
    this.isCurrentlyActive = isActive
  }
}
