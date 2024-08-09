import ExpoModulesCore

public class ExpoPlatformInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPlatformInfo")

    Function("getIsReducedMotionEnabled") {
      return UIAccessibility.isReduceMotionEnabled
    }

    Function("setAudioMixWithOthers") { (mixWithOthers: Bool) in
      var options: AVAudioSession.CategoryOptions
      if mixWithOthers {
        options = [.mixWithOthers]
      } else {
        options = []
      }
      try? AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playback, mode: .default, options: options)
    }
  }
}
