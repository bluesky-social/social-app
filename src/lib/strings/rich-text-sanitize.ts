import {RichText} from './rich-text'

const EXCESS_SPACE_RE = /[\r\n]([\u00AD\u2060\u200D\u200C\u200B\s]*[\r\n]){2,}/
const REPLACEMENT_STR = '\n\n'

export function removeExcessNewlines(richText: RichText): RichText {
  return clean(richText, EXCESS_SPACE_RE, REPLACEMENT_STR)
}

// TODO: check on whether this works correctly with multi-byte codepoints
export function clean(
  richText: RichText,
  targetRegexp: RegExp,
  replacementString: string,
): RichText {
  richText = richText.clone()

  let match = richText.text.match(targetRegexp)
  while (match && typeof match.index !== 'undefined') {
    const oldText = richText.text
    const removeStartIndex = match.index
    const removeEndIndex = removeStartIndex + match[0].length
    richText.delete(removeStartIndex, removeEndIndex)
    if (richText.text === oldText) {
      break // sanity check
    }
    richText.insert(removeStartIndex, replacementString)
    match = richText.text.match(targetRegexp)
  }

  return richText
}
