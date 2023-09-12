async function grabEmojiData() {
  try {
    const response = await fetch('/static/emojis.2023.json')
    const emojiMartData = await response.json()
    window.emojiMartData = emojiMartData
  } catch (error) {
    console.warn(`Failed to load emojis`)
  }
}

grabEmojiData()
