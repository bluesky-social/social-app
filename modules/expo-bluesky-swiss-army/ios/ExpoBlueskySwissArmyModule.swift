import ExpoModulesCore

public class ExpoBlueskySwissArmyModule: Module {
  func getDefaults(_ useAppGroup: Bool) -> UserDefaults? {
    if useAppGroup {
      return UserDefaults(suiteName: "group.app.bsky")
    } else {
      return UserDefaults.standard
    }
  }
  
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskySwissArmy")
    
    AsyncFunction("getStringValueAsync") { (key: String, useAppGroup: Bool) in
      let defaults = self.getDefaults(useAppGroup)
      
      return defaults?.string(forKey: key)
    }
    
    AsyncFunction("setStringValueAsync") { (key: String, value: String?, useAppGroup: Bool) in
      let defaults = self.getDefaults(useAppGroup)
      defaults?.setValue(value, forKey: key)
    }
  }
}
