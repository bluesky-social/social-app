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

/*export function sanitizePost(postRecord?: AppBskyFeedPost.Record): any {
  // Mutates postRecord
  if (!postRecord) {
    return
  }
  const postText = postRecord.text
  let match = matchExcessSpace(postText)

  while (match && typeof match.index !== 'undefined') {
    const startIndex = match.index
    const endIndex = startIndex + match[0].length
    const newRecordText =
      postRecord.text.slice(0, startIndex) +
      REPLACEMENT_STR +
      postRecord.text.slice(endIndex)
    if (newRecordText === postRecord.text) {
      // To ensure we never run into an infinite loop
      break
    } else {
      postRecord.text = newRecordText
    }

    const entities = postRecord.entities
    const removedStringLength = endIndex - startIndex

    // Remove entities that are completely within the removed range
    // Adjust the start and end index of entities that are after the removed range
    postRecord.entities = entities
      ?.filter(entity => {
        return !(
          entity.index.start >= startIndex && entity.index.end <= endIndex
        )
      })
      .map(entity => {
        if (entity.index.start >= endIndex) {
          return {
            ...entity,
            index: {
              start:
                entity.index.start -
                removedStringLength +
                REPLACEMENT_STR.length,
              end:
                entity.index.end - removedStringLength + REPLACEMENT_STR.length,
            },
          }
        } else {
          return entity
        }
      })

    match = matchExcessSpace(postRecord.text)
  }

  return postText
}
*/
