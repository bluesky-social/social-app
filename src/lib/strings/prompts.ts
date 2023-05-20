const replyPrompts = [
  'Write your reply',
  'Add to the conversation',
  'Be authentic',
  'Join in and contribute',
  "Don't be mean here",
]

export function replyToPrompt(originText?: string) {
  // prefer random reply prompt if no text
  if (!originText) {
    return replyPrompts[Math.floor(Math.random() * replyPrompts.length)]
  }

  // offer consistent text for good UX
  const hash = Math.abs(
    originText.split('').reduce((hc, curr) => {
      hc = curr.charCodeAt(0) + (hc << 6) + (hc << 16) - hc
      return hc
    }, 0),
  )

  return replyPrompts[hash % replyPrompts.length]
}
