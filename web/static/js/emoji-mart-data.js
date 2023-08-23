const response = await fetch('/static/emonjis.2023.json')

const emojiMartData = await response.json()

window.emojiMartData = emojiMartData
