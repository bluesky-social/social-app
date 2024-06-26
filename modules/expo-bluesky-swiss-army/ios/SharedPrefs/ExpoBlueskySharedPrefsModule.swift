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
      guard value.isString() || value.isNumber() || value.isBool() || value.isNull() || value.isUndefined() else {
        promise.reject("UNSUPPORTED_TYPE_ERROR", "Attempted to set an unsupported type")
        return false
      }
      
      guard let defaults = self.getDefaults() else {
        promise.reject("PREFS_ERROR", "Was unable to get shared preferences")
        return false
      }
      
      if value.isNumber() {
        defaults.set(value.getDouble(), forKey: key)
      } else {
        defaults.set(value.getRaw(), forKey: key)
      }
      promise.resolve()
      return true
    }
    
    AsyncFunction("removeValueAsync") { (key: String) in
      self.getDefaults(key)?.removeObject(forKey: key)
    }

    AsyncFunction("getStringAsync") { (key: String) in
      return self.getDefaults(key)?.string(forKey: key)
    }
    
    AsyncFunction("getBoolAsync") { (key: String) in
      return self.getDefaults(key)?.bool(forKey: key)
    }
    
    AsyncFunction("getNumberAsync") { (key: String) in
      return self.getDefaults(key)?.double(forKey: key)
    }
    
    AsyncFunction("addToSetAsync") { (key: String, value: String) in      
      var dict: [String:Bool]?
      if var currDict = self.getDefaults(key)?.dictionary(forKey: key) as? [String:Bool] {
        currDict[value] = true
        dict = currDict
      } else {
        dict = [
          value : true
        ]
      }
      self.getDefaults(key)?.setValue(dict, forKey: key)
    }
    
    AsyncFunction("removeFromSetAsync") { (key: String, value: String) in
      guard var dict = self.getDefaults(key)?.dictionary(forKey: key) as? [String:Bool] else {
        return
      }
      dict.removeValue(forKey: value)
      self.getDefaults(key)?.setValue(dict, forKey: key)
    }
    
    AsyncFunction("setContainsAsync") { (key: String, value: String) in
      guard let dict = self.getDefaults(key)?.dictionary(forKey: key) as? [String:Bool] else {
        return false
      }
      return dict[value] == true
    }
  }
}
