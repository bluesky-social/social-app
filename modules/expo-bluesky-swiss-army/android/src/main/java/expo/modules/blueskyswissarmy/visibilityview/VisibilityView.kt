package expo.modules.blueskyswissarmy.visibilityview

import android.content.Context
import android.graphics.Rect
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class VisibilityView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  var isViewEnabled: Boolean = false

  private val onChangeStatus by EventDispatcher()

  private var isCurrentlyActive = false

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    VisibilityViewManager.addView(this)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    VisibilityViewManager.removeView(this)
  }

  fun setIsCurrentlyActive(isActive: Boolean) {
    if (isCurrentlyActive == isActive) {
      return
    }

    this.isCurrentlyActive = isActive
    this.onChangeStatus(
      mapOf(
        "isActive" to isActive,
      ),
    )
  }

  fun getPositionOnScreen(): Rect? {
    if (!this.isShown) {
      return null
    }

    val screenPosition = intArrayOf(0, 0)
    this.getLocationInWindow(screenPosition)
    return Rect(
      screenPosition[0],
      screenPosition[1],
      screenPosition[0] + this.width,
      screenPosition[1] + this.height,
    )
  }

  fun isViewableEnough(): Boolean {
    val positionOnScreen = this.getPositionOnScreen() ?: return false
    val visibleArea = positionOnScreen.width() * positionOnScreen.height()
    val totalArea = this.width * this.height
    return visibleArea >= 0.5 * totalArea
  }
}
