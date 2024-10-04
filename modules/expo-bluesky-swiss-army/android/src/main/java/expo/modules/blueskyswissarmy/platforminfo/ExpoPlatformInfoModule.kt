package expo.modules.blueskyswissarmy.platforminfo

import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoPlatformInfoModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoPlatformInfo")

      // See https://github.com/software-mansion/react-native-reanimated/blob/7df5fd57d608fe25724608835461cd925ff5151d/packages/react-native-reanimated/android/src/main/java/com/swmansion/reanimated/nativeProxy/NativeProxyCommon.java#L242
      Function("getIsReducedMotionEnabled") {
        val resolver = appContext.reactContext?.contentResolver ?: return@Function false
        val scale = Settings.Global.getString(resolver, Settings.Global.TRANSITION_ANIMATION_SCALE) ?: return@Function false

        try {
          return@Function scale.toFloat() == 0f
        } catch (_: Error) {
          return@Function false
        }
      }
    }
}
