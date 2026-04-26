const LINE_SEPARATOR_BEFORE_NEWLINE_RE = /[\u2028\u2029]+(?=\r?\n)/g
const LINE_SEPARATOR_RE = /[\u2028\u2029]/g

export function normalizeLineSeparators(text: string) {
  return text
    .replace(LINE_SEPARATOR_BEFORE_NEWLINE_RE, '')
    .replace(LINE_SEPARATOR_RE, '\n')
}
