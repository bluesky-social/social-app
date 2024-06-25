import ExpoModulesCore

public class ExpoBlueskyReferrerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyReferrer")

    AsyncFunction("getReferrerInfoAsync") { (promise: Promise) in
      let defaults = UserDefaults.standard
      let referrerUrlString = defaults.string(forKey: "referrer")
      let referrerApp = defaults.string(forKey: "referrerApp")

      if let referrerUrlString = defaults.string(forKey: "referrer"),
         let url = URL(string: referrerUrlString)
      {
        if #available(iOS 16.0, *) {
          promise.resolve([
            "referrer": url.absoluteString,
            "hostname": url.host() ?? ""
          ])
        } else {
          promise.resolve([
            "referrer": url.absoluteString,
            "hostname": url.host ?? ""
          ])
        }
      } else if let referrerApp = defaults.string(forKey: "referrerApp") {
        promise.resolve([
          "referrer": referrerApp,
          "hostname": referrerApp,
        ])
      } else {
        promise.resolve(nil)
      }
    }
  }
}
