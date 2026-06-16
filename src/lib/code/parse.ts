/**
 * Splits a run of post text into plain text, inline code (`code`) and fenced
 * code blocks (```lang\n...```). Used by `#/components/RichTextCode` to render
 * Markdown-style code in post bodies.
 *
 * Intentionally small and forgiving: only balanced delimiters become code, so
 * stray or unmatched backticks render as literal text. A single-line triple
 * fence (```code```) is treated as inline code, since highlighting one line adds
 * nothing; only multi-line fences become highlighted blocks.
 */
export type CodeToken =
  | {type: 'text'; value: string}
  | {type: 'inline'; value: string}
  | {type: 'fence'; value: string; lang?: string}

// Order matters: the multi-line fence alternative must precede the single-line
// one so a fenced block is never mis-split.
//   1. ```lang\n body \n```   -> multi-line block (group 1 = lang, group 2 = body)
//   2. ```inline```           -> single-line triple (group 3)
//   3. `inline`               -> inline (group 4)
// The info string (group 1) is everything up to the first newline, so labels
// with non-word chars or trailing space (`c++`, `c#`, `ts `) still match and
// render as a block; the label is trimmed before language lookup.
const CODE_RE = /```([^\n`]*)\n([\s\S]*?)\n?```|```([^\n`]+?)```|`([^`\n]+?)`/g

export function parseCodeTokens(text: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let last = 0
  let m: RegExpExecArray | null
  CODE_RE.lastIndex = 0
  while ((m = CODE_RE.exec(text))) {
    if (m.index > last) {
      tokens.push({type: 'text', value: text.slice(last, m.index)})
    }
    if (m[2] !== undefined) {
      tokens.push({type: 'fence', value: m[2], lang: m[1]?.trim() || undefined})
    } else {
      // Single-line triple (m[3]) and inline (m[4]) both render as inline code.
      tokens.push({type: 'inline', value: m[3] ?? m[4]})
    }
    last = CODE_RE.lastIndex
  }
  if (last < text.length) {
    tokens.push({type: 'text', value: text.slice(last)})
  }
  return tokens
}

/** True if `text` contains at least one inline or fenced code span. */
export function hasCode(text: string): boolean {
  CODE_RE.lastIndex = 0
  const found = CODE_RE.test(text)
  CODE_RE.lastIndex = 0
  return found
}
