import ExpoModulesCore

public class ExpoPlatformInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPlatformInfo")

    Function("getIsReducedMotionEnabled") {
      return UIAccessibility.isReduceMotionEnabled
    }

    Function("setAudioCategory") { (audioCategoryString: String) in
      let audioCategory = AVAudioSession.Category(rawValue: audioCategoryString)

      DispatchQueue.global(qos: .background).async {
        try? AVAudioSession.sharedInstance().setCategory(audioCategory)
      }
    }

    Function("setAudioActive") { (active: Bool) in
      if active {
        DispatchQueue.global(qos: .background).async {
          try? AVAudioSession.sharedInstance().setActive(true)
        }
      } else {
        DispatchQueue.global(qos: .background).async {
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
}
