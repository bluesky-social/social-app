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
      if active {
        try? AVAudioSession.sharedInstance().setActive(true)
      } else {
        try? AVAudioSession
          .sharedInstance()
          .setActive(
            false,
            options: [.notifyOthersOnDeactivation]
          )
      }
    }
  }
}
