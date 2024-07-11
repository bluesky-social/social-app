package expo.modules.blueskyswissarmy.visibilityview

import android.util.Log
import java.util.Timer
import java.util.TimerTask
import java.util.WeakHashMap

class VisibilityViewManager {
  companion object {
    private val views = WeakHashMap<Int, VisibilityView>()
    private var currentlyActiveView: VisibilityView? = null
    private var timer: Timer? = null

    fun addView(view: VisibilityView) {
      this.views[view.id] = view
      if (views.count() == 1) {
        this.startTimer()
      }
    }

    fun removeView(view: VisibilityView) {
      this.views.remove(view.id)
      if (this.views.isEmpty()) {
        this.invalidateTimer()
      }
    }

    private fun startTimer() {
      val timer = Timer()
      timer.schedule(
        object : TimerTask() {
          override fun run() {
            onInterval()
          }
        },
        0,
        1000,
      )

      this.timer = timer
    }

    private fun invalidateTimer() {
      this.timer?.cancel()
      this.timer = null
    }

    fun onInterval() {
      var activeView: VisibilityView? = null

      Log.d(TAG, "onInterval")

      if (this.views.isEmpty()) {
        Log.d(TAG, "No views")
        return
      } else if (this.views.count() == 1) {
        Log.d(TAG, "${this.views[0]?.getScreenPosition()}")
      } else {
        for (view in this.views.values) {
          val screenPosition = view.getScreenPosition()
          if (screenPosition != null) {
            Log.d(TAG, "${view.id}: $screenPosition")
            if (screenPosition.contains(0, 0)) {
              activeView = view
              break
            }
          }
        }
      }
    }

    fun setActiveView(view: VisibilityView) {
      this.currentlyActiveView?.setCurrentlyActive(false)
      view.setCurrentlyActive(true)
      this.currentlyActiveView = view
    }
  }
}
