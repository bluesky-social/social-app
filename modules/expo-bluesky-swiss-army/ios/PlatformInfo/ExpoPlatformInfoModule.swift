import ExpoModulesCore

public class ExpoPlatformInfoModule: Module {
  private var prevAudioActive: Bool?
  private var prevAudioCategory: AVAudioSession.Category?

  public func definition() -> ModuleDefinition {
    Name("ExpoPlatformInfo")

    Function("getIsReducedMotionEnabled") {
      return UIAccessibility.isReduceMotionEnabled
    }

    Function("setAudioCategory") { (audioCategoryString: String) in
      let audioCategory = AVAudioSession.Category(rawValue: audioCategoryString)
      if audioCategory == self.prevAudioCategory {
        return
      }
      self.prevAudioCategory = audioCategory
      DispatchQueue.global(qos: .background).async {
        try? AVAudioSession.sharedInstance().setCategory(audioCategory)
      }
    }

    Function("setAudioActive") { (active: Bool) in
      if active == self.prevAudioActive {
        return
      }
      self.prevAudioActive = active
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
