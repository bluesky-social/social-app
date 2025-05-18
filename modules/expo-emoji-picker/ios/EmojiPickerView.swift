import ExpoModulesCore
import WebKit
import MCEmojiPicker

class EmojiPickerView: ExpoView, MCEmojiPickerDelegate {
  let onEmojiSelected = EventDispatcher()

  override func layoutSubviews() {
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
    reactRootVC?.present(emojiPicker, animated: true)
  }

  func didGetEmoji(emoji: String) {
    onEmojiSelected([
      "emoji": emoji
    ])
  }
}
