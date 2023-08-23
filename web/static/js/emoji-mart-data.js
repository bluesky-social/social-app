async function grabEmojiData() {
  const response = await fetch('/static/emojis.2023.json')
  const emojiMartData = await response.json()
  window.emojiMartData = emojiMartData
}

grabEmojiData()
