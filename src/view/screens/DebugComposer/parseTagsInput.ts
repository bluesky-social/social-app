/**
 * Parse a comma-separated tags string into explicit post tags: trim each
 * part, strip one leading #, drop empties, and dedupe preserving order.
 */
export function parseTagsInput(text: string): string[] {
  const tags: string[] = []
  for (const part of text.split(',')) {
    const tag = part.trim().replace(/^#/, '')
    if (tag && !tags.includes(tag)) {
      tags.push(tag)
    }
  }
  return tags
}
