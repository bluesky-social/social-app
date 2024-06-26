import Foundation

class SharedPrefs {
  public static let shared = SharedPrefs()
  
  private let defaults = UserDefaults(suiteName: "group.app.bsky")
  
  init() {
    if defaults == nil {
      NSLog("Failed to get user defaults for app group.")
    }
  }
  
  func getDefaults(_ info: String = "(no info)") -> UserDefaults? {
    guard let defaults = self.defaults else {
      NSLog("Failed to get defaults for app group: \(info)")
      return nil
    }
    return defaults
  }
  
  func setValue(_ key: String, _ value: String?) {
    getDefaults(key)?.setValue(value, forKey: key)
  }
  
  func setValue(_ key: String, _ value: Double?) {
    getDefaults(key)?.setValue(value, forKey: key)
  }
  
  func setValue(_ key: String, _ value: Bool?) {
    getDefaults(key)?.setValue(value, forKey: key)
  }
  
  func removeValue(_ key: String) {
    getDefaults(key)?.removeObject(forKey: key)
  }
  
  func getString(_ key: String) -> String? {
    return getDefaults(key)?.string(forKey: key)
  }
  
  func getNumber(_ key: String) -> Double? {
    return getDefaults(key)?.double(forKey: key)
  }
  
  func getBool(_ key: String) -> Bool? {
    return getDefaults(key)?.bool(forKey: key)
  }
  
  func addToSet(_ key: String, _ value: String) {
    var dict: [String:Bool]?
    if var currDict = getDefaults(key)?.dictionary(forKey: key) as? [String:Bool] {
      currDict[value] = true
      dict = currDict
    } else {
      dict = [
        value : true
      ]
    }
    getDefaults(key)?.setValue(dict, forKey: key)
  }
  
  func removeFromSet(_ key: String, _ value: String) {
    guard var dict = getDefaults(key)?.dictionary(forKey: key) as? [String:Bool] else {
      return
    }
    dict.removeValue(forKey: value)
    getDefaults(key)?.setValue(dict, forKey: key)
  }
  
  func setContains(_ key: String, _ value: String) -> Bool {
    guard let dict = getDefaults(key)?.dictionary(forKey: key) as? [String:Bool] else {
      return false
    }
    return dict[value] == true
  }
}
