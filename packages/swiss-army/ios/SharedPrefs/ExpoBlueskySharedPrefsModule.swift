import Foundation
import ExpoModulesCore

public class ExpoBlueskySharedPrefsModule: Module {
  let defaults = UserDefaults(suiteName: "group.app.bsky")

  func getDefaults(_ info: String = "(no info)") -> UserDefaults? {
    guard let defaults = self.defaults else {
      NSLog("Failed to get defaults for app group: \(info)")
      return nil
    }
    return defaults
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskySharedPrefs")

    // JavaScripValue causes a crash when trying to check `isString()`. Let's
    // explicitly define setString instead.
    Function("setString") { (key: String, value: String?) in
      SharedPrefs.shared.setValue(key, value)
    }

    // Since SDK 58, `JavaScriptValue` can't be a `Function` argument, so each
    // type gets its own setter and JS picks one.
    Function("setNumber") { (key: String, value: Double) in
      SharedPrefs.shared.setValue(key, value)
    }

    Function("setBool") { (key: String, value: Bool) in
      SharedPrefs.shared.setValue(key, value)
    }

    Function("removeValue") { (key: String) in
      SharedPrefs.shared.removeValue(key)
    }

    Function("getString") { (key: String) in
      return SharedPrefs.shared.getString(key)
    }

    Function("getBool") { (key: String) in
      return SharedPrefs.shared.getBool(key)
    }

    Function("getNumber") { (key: String) in
      return SharedPrefs.shared.getNumber(key)
    }

    Function("addToSet") { (key: String, value: String) in
      SharedPrefs.shared.addToSet(key, value)
    }

    Function("removeFromSet") { (key: String, value: String) in
      SharedPrefs.shared.removeFromSet(key, value)
    }

    Function("setContains") { (key: String, value: String) in
      return SharedPrefs.shared.setContains(key, value)
    }
  }
}
