package app.bsky.scrollforwarder

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.ScrollForwarderViewManagerDelegate
import com.facebook.react.viewmanagers.ScrollForwarderViewManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = ScrollForwarderViewManager.NAME)
class ScrollForwarderViewManager : ReactViewManager(),
  ScrollForwarderViewManagerInterface<ReactViewGroup> {
  private val delegate = ScrollForwarderViewManagerDelegate(this)

  override fun getName() = NAME

  override fun getDelegate(): ViewManagerDelegate<ReactViewGroup> = delegate

  override fun createViewInstance(context: ThemedReactContext) = ScrollForwarderView(context)

  override fun onDropViewInstance(view: ReactViewGroup) {
    (view as ScrollForwarderView).finishGesture()
    super.onDropViewInstance(view)
  }

  override fun setScrollViewTag(view: ReactViewGroup, value: Int) {
    (view as ScrollForwarderView).scrollViewTag = value
  }

  /** Refresh state belongs to the target list's existing RefreshControl on Android. */
  override fun setRefreshing(view: ReactViewGroup, value: Boolean) = Unit

  companion object {
    const val NAME = "ScrollForwarderView"
  }
}
