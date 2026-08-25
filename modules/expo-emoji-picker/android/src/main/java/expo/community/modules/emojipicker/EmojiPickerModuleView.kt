package expo.community.modules.emojipicker

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import androidx.emoji2.emojipicker.EmojiPickerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class EmojiPickerModuleView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private var emojiView: EmojiPickerView = EmojiPickerView(context)
  private val onEmojiSelected by EventDispatcher()

  init {
    setupView()
  }

  private fun setupView() {
    addView(
      emojiView,
      LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT,
      ),
    )

    emojiView.setOnEmojiPickedListener { emoji ->
      onEmojiSelected(mapOf("emoji" to emoji.emoji))
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration?) {
    super.onConfigurationChanged(newConfig)
    removeView(emojiView)
    setupView()
  }
}
