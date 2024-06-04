package expo.modules.googleplayreferrer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGooglePlayReferrerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGooglePlayReferrer")

    AsyncFunction("getReferrerInfoAsync") {

    }
  }
}
