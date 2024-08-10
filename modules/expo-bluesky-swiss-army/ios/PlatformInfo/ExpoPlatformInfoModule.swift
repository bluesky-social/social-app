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

    Function("setAudioActive") { (active: Bool) in
      var categoryOptions: AVAudioSession.CategoryOptions
      let currentCategory = AVAudioSession.sharedInstance().category

      if active {
        categoryOptions = [.mixWithOthers]
        try? AVAudioSession.sharedInstance().setActive(true)
      } else {
        categoryOptions = [.duckOthers]
        try? AVAudioSession
          .sharedInstance()
          .setActive(
            false,
            options: [.notifyOthersOnDeactivation]
          )
      }

      try? AVAudioSession
        .sharedInstance()
        .setCategory(
          currentCategory,
          mode: .default,
          options: categoryOptions
        )
    }
  }
}
