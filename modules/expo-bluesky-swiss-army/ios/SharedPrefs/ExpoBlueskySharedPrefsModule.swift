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

    AsyncFunction("setValueAsync") { (key: String, value: JavaScriptValue, promise: Promise) in
      if value.isString() {
        SharedPrefs.shared.setValue(key, value.getString())
      } else if value.isNumber() {
        SharedPrefs.shared.setValue(key, value.getDouble())
      } else if value.isBool() {
        SharedPrefs.shared.setValue(key, value.getBool())
      } else if value.isNull() || value.isUndefined() {
        SharedPrefs.shared.removeValue(key)
      } else {
        promise.reject("UNSUPPORTED_TYPE_ERROR", "Attempted to set an unsupported type")
      }
    }

    AsyncFunction("removeValueAsync") { (key: String) in
      SharedPrefs.shared.removeValue(key)
    }

    AsyncFunction("getStringAsync") { (key: String) in
      return SharedPrefs.shared.getString(key)
    }

    AsyncFunction("getBoolAsync") { (key: String) in
      return SharedPrefs.shared.getBool(key)
    }

    AsyncFunction("getNumberAsync") { (key: String) in
      return SharedPrefs.shared.getNumber(key)
    }

    AsyncFunction("addToSetAsync") { (key: String, value: String) in
      SharedPrefs.shared.addToSet(key, value)
    }

    AsyncFunction("removeFromSetAsync") { (key: String, value: String) in
      SharedPrefs.shared.removeFromSet(key, value)
    }

    AsyncFunction("setContainsAsync") { (key: String, value: String) in
      return SharedPrefs.shared.setContains(key, value)
    }
  }
}
