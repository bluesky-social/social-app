import ExpoModulesCore

let APP_GROUP = "group.app.bsky"

/*
 * The purpose of this module is to store values that are needed by the notification service
 * extension. Since we would rather get and store values such as age or user mute state
 * while the app is foregrounded, we should use this module liberally. We should aim to keep
 * background fetches to a minimum (two or three times per hour) while the app is backgrounded
 * or killed
 */
public class ExpoBackgroundNotificationHandlerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundNotificationHandler")
    
    AsyncFunction("setPlaySoundChat") { (playSound: Bool) in
      UserDefaults(suiteName: APP_GROUP)?.setValue(playSound, forKey: "playSoundChat")
    }
    
    AsyncFunction("setPlaySoundOther") { (playSound: Bool) in
      UserDefaults(suiteName: APP_GROUP)?.setValue(playSound, forKey: "playSoundOther")
    }
  }
}
