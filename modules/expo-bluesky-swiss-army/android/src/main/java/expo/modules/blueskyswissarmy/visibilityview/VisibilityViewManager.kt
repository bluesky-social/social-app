package expo.modules.blueskyswissarmy.visibilityview

import android.graphics.Rect
import java.util.WeakHashMap

class VisibilityViewManager {
  companion object {
    private val views = WeakHashMap<Int, VisibilityView>()
    private var currentlyActiveView: VisibilityView? = null

    fun addView(view: VisibilityView) {
      this.views[view.id] = view
    }

    fun removeView(view: VisibilityView) {
      this.views.remove(view.id)
    }

    fun updateActiveView() {
      var activeView: VisibilityView? = null

      if (this.views.count() == 1) {
        val view = this.views.values.first()
        if (view.isViewableEnough()) {
          activeView = view
        }
      } else if (this.views.count() > 1) {
        val views = this.views.values
        var mostVisibleView: VisibilityView? = null
        var mostVisiblePosition: Rect? = null

        views.forEach { view ->
          if (!view.isViewableEnough()) {
            return
          }

          val position = view.getPositionOnScreen() ?: return@forEach

          if (position.centerY() >= 150) {
            if (mostVisiblePosition == null) {
              mostVisiblePosition = position
            }

            if (position.centerY() <= mostVisiblePosition!!.centerY()) {
              mostVisibleView = view
              mostVisiblePosition = position
            }
          }
        }

        activeView = mostVisibleView
      }

      if (activeView == this.currentlyActiveView) {
        return
      }

      this.clearActiveView()
      if (activeView != null) {
        this.setActiveView(activeView)
      }
    }

    private fun clearActiveView() {
      this.currentlyActiveView?.setIsCurrentlyActive(false)
      this.currentlyActiveView = null
    }

    private fun setActiveView(view: VisibilityView) {
      view.setIsCurrentlyActive(true)
      this.currentlyActiveView = view
    }
  }
}
