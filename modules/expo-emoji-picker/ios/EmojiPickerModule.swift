import ExpoModulesCore

public class EmojiPickerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EmojiPicker")

    View(EmojiPickerView.self) {
      Events("onEmojiSelected")
    }
  }
}
