package expo.modules.blueskyswissarmy.deviceprefs

import android.content.Context
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class VisibilityView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onVisibleChange by EventDispatcher()

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    onVisibleChange(mapOf("visible" to true))
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    onVisibleChange(mapOf("visible" to false))
  }
}