import ExpoModulesCore
import MCEmojiPicker

class EmojiPickerView: ExpoView, MCEmojiPickerDelegate {
  let onEmojiSelected = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    self.addGestureRecognizer(tapGesture)
  }

  @objc func handleTap(_ gesture: UITapGestureRecognizer) {
    presentEmojiPicker()
  }

  func presentEmojiPicker() {
    let emojiPicker = MCEmojiPickerViewController()
    let reactRootVC = reactViewController()
    emojiPicker.sourceView = self
    emojiPicker.delegate = self
    emojiPicker.arrowDirection = preferredArrowDirection()
    reactRootVC?.present(emojiPicker, animated: true)
  }

  /// If the trigger sits in the bottom third of the screen there isn't enough
  /// room below it for a usable popover, so anchor the picker above instead.
  private func preferredArrowDirection() -> MCPickerArrowDirection {
    guard let window = self.window else { return .up }
    let frameInWindow = self.convert(self.bounds, to: window)
    let threshold = window.bounds.height * (2.0 / 3.0)
    return frameInWindow.midY >= threshold ? .down : .up
  }

  func didGetEmoji(emoji: String) {
    onEmojiSelected([
      "emoji": emoji
    ])
  }
}
