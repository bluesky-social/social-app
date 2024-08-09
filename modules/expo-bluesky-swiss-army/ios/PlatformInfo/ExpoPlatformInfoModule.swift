import ExpoModulesCore

public class ExpoPlatformInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPlatformInfo")

    Function("getIsReducedMotionEnabled") {
      return UIAccessibility.isReduceMotionEnabled
    }

    Function("setAudioCategory") { (audioCategoryString: String) in
      let audioCategory = AVAudioSession.Category(rawValue: audioCategoryString)
      try? AVAudioSession.sharedInstance().setCategory(audioCategory)
    }

    Function("setAudioMixWithOthers") { (mixWithOthers: Bool) in
      var options: AVAudioSession.CategoryOptions
      let currentCategory = AVAudioSession.sharedInstance().category
      if mixWithOthers {
        options = [.mixWithOthers]
      } else {
        options = [.duckOthers]
      }
      try? AVAudioSession
        .sharedInstance()
        .setCategory(
          currentCategory,
          mode: .default,
          options: options
        )
    }
  }
}
