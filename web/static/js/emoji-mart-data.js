const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')

const emojiMartData = await response.json()

window.emojiMartData = emojiMartData
