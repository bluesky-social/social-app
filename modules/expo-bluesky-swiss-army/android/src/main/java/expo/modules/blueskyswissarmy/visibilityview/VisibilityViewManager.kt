package expo.modules.blueskyswissarmy.visibilityview

import android.graphics.Rect

class VisibilityViewManager {
  companion object {
    private val views = HashMap<Int, VisibilityView>()
    private var currentlyActiveView: VisibilityView? = null
    private var prevCount = 0

    fun addView(view: VisibilityView) {
      this.views[view.id] = view

      if (this.prevCount == 0) {
        this.updateActiveView()
      }
      this.prevCount = this.views.count()
    }

    fun removeView(view: VisibilityView) {
      this.views.remove(view.id)
      this.prevCount = this.views.count()
    }

    fun updateActiveView() {
      var activeView: VisibilityView? = null
      val count = this.views.count()

      if (count == 1) {
        val view = this.views.values.first()
        if (view.isViewableEnough()) {
          activeView = view
        }
      } else if (count > 1) {
        val views = this.views.values
        var mostVisibleView: VisibilityView? = null
        var mostVisiblePosition: Rect? = null

        views.forEach { view ->
          if (!view.isViewableEnough()) {
            return
          }

          val position = view.getPositionOnScreen() ?: return@forEach
          val topY = position.centerY() - (position.height() / 2)

          if (topY >= 150) {
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
