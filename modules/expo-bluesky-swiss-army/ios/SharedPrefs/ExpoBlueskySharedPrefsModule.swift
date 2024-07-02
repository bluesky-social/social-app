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

    Function("setValue") { (key: String, value: JavaScriptValue) in
      if value.isNumber() {
        SharedPrefs.shared.setValue(key, value.getDouble())
      } else if value.isBool() {
        SharedPrefs.shared.setValue(key, value.getBool())
      } else if value.isNull() || value.isUndefined() {
        SharedPrefs.shared.removeValue(key)
      }
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
