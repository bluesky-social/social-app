interface FoundMention {
  value: string
  index: number
}

export function getMentionAt(
  text: string,
  cursorPos: number,
): FoundMention | undefined {
  let re = /(^|\s)@([a-z0-9.]*)/gi
  let match
  while ((match = re.exec(text))) {
    const spaceOffset = match[1].length
    const index = match.index + spaceOffset
    if (
      cursorPos >= index &&
      cursorPos <= index + match[0].length - spaceOffset
    ) {
      return {value: match[2], index}
    }
  }
  return undefined
}

export function insertMentionAt(
  text: string,
  cursorPos: number,
  mention: string,
) {
  const target = getMentionAt(text, cursorPos)
  if (target) {
    return `${text.slice(0, target.index)}@${mention} ${text.slice(
      target.index + target.value.length + 1, // add 1 to include the "@"
    )}`
  }
  return text
}
