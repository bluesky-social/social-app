package xyz.blueskyweb.app.textwrapfix

import android.content.Context
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.text.ReactTextViewManager

/**
 * Works around Android silently dropping the last line of wrapped post text
 * (#5235).
 *
 * React Native (old architecture) measures text with a StaticLayout built at
 * ceil(availableWidth), but the TextView later re-breaks the same text at the
 * Yoga-rounded integer frame width, which can be up to ~2px narrower
 * (measurement ceil plus frame position rounding). A line whose advance width
 * falls inside that window fits during measurement but wraps during render,
 * pushing the last line below the measured bounds where it is clipped.
 *
 * TextView computes its wrap width as viewWidth - compoundPadding, so
 * reporting slightly less right padding widens the render-side wrap width to
 * cover the window: the renderer can always fit what measurement fit. Worst
 * case, a knife-edge line paints up to 2px of a glyph edge past the view
 * bounds instead of dropping a whole word.
 *
 * Old architecture only. Remove after migrating to the new architecture:
 * Fabric's prepared text layouts draw the measured layout directly, so the
 * two passes cannot disagree.
 */
private const val RENDER_WRAP_SLACK_PX = 2

internal class WrapWidthTextView(context: Context) : ReactTextView(context) {
  override fun getCompoundPaddingRight(): Int =
      super.getCompoundPaddingRight() - RENDER_WRAP_SLACK_PX
}

internal class WrapWidthTextViewManager : ReactTextViewManager() {
  override fun createViewInstance(context: ThemedReactContext): ReactTextView =
      WrapWidthTextView(context)
}

/**
 * Must be registered after the autolinked packages so that its "RCTText"
 * view manager replaces the stock one (last registration wins).
 */
class WrapWidthTextPackage : ReactPackage {
  override fun createNativeModules(
      reactContext: ReactApplicationContext
  ): List<NativeModule> = emptyList()

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> =
      if (ReactNativeFeatureFlags.enablePreparedTextLayout()) {
        /*
         * Prepared text layouts (new architecture) draw the measured layout
         * directly, which fixes the bug for real. Registering our manager
         * would replace PreparedLayoutTextViewManager, so step aside.
         */
        emptyList()
      } else {
        listOf(WrapWidthTextViewManager())
      }
}
