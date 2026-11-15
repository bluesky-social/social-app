/*
 * Helpers for the pronoun quick picks in Edit Profile. Suggestions are full
 * "subject/object" forms like "she/her". One pick fills in the full form, and
 * several picks combine their subject forms in pick order, e.g. "she/they".
 */

/**
 * The subject form of a suggestion, e.g. "she" for "she/her".
 */
function subjectOf(suggestion: string) {
  return suggestion.split('/')[0].trim()
}

function normalize(text: string) {
  return text.trim().toLocaleLowerCase()
}

/**
 * Which suggestions `value` is made of, as indexes into `suggestions` in the
 * order they appear. Returns `null` when `value` has anything the suggestions
 * don't cover, e.g. custom pronouns.
 */
export function parsePronouns(
  value: string,
  suggestions: string[],
): number[] | null {
  const text = normalize(value)
  if (!text) return []

  const full = suggestions.findIndex(s => normalize(s) === text)
  if (full !== -1) return [full]

  const subjects = suggestions.map(s => normalize(subjectOf(s)))
  const indexes: number[] = []
  for (const part of text.split('/')) {
    const index = subjects.indexOf(part.trim())
    if (index === -1 || indexes.includes(index)) return null
    indexes.push(index)
  }
  return indexes.length > 1 ? indexes : null
}

/**
 * Builds the pronouns text for the picked suggestions, in pick order.
 */
export function composePronouns(indexes: number[], suggestions: string[]) {
  if (indexes.length === 0) return ''
  if (indexes.length === 1) return suggestions[indexes[0]]
  return indexes.map(i => subjectOf(suggestions[i])).join('/')
}

/**
 * The new pronouns text after tapping the suggestion at `index`. Tapping a
 * picked suggestion removes it, and tapping one while `value` holds custom
 * text replaces that text.
 */
export function togglePronoun(
  value: string,
  index: number,
  suggestions: string[],
) {
  const picked = parsePronouns(value, suggestions)
  if (!picked) return composePronouns([index], suggestions)
  const next = picked.includes(index)
    ? picked.filter(i => i !== index)
    : [...picked, index]
  return composePronouns(next, suggestions)
}

/**
 * What changed in the pronouns on save, for the `profile:pronouns:save`
 * metric. Never includes the text itself, only how it was entered. Returns
 * `undefined` when nothing changed beyond surrounding whitespace.
 */
export function describePronounsChange(
  previous: string,
  next: string,
  suggestions: string[],
):
  | {action: 'remove'}
  | {action: 'add' | 'edit'; source: 'preset' | 'combined' | 'custom'}
  | undefined {
  const before = previous.trim()
  const after = next.trim()
  if (before === after) return undefined
  if (!after) return {action: 'remove'}
  const picked = parsePronouns(after, suggestions)
  return {
    action: before ? 'edit' : 'add',
    source: !picked ? 'custom' : picked.length > 1 ? 'combined' : 'preset',
  }
}
