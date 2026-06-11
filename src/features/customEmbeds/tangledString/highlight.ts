/**
 * Syntax highlighting via `lowlight` (highlight.js grammars).
 *
 * `lowlight` is pure JS with no DOM dependency, so the same code runs on web and
 * React Native. It returns a hast tree; we flatten that into lines of scoped
 * spans so the renderer (`CodeBlock`) owns all layout and ALF theming. The
 * `scope` on each span is the highlight.js class with the `hljs-` prefix
 * stripped (e.g. `keyword`, `string`, `title.function_`).
 */
import {type Root, type RootContent} from 'hast'
import {common, createLowlight} from 'lowlight'

const lowlight = createLowlight(common)

export type Span = {scope?: string; value: string}
export type Line = Span[]

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  kt: 'kotlin',
  kts: 'kotlin',
  swift: 'swift',
  php: 'php',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'xml',
  htm: 'xml',
  xml: 'xml',
  svg: 'xml',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'ini',
  ini: 'ini',
  sql: 'sql',
  md: 'markdown',
  markdown: 'markdown',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  lua: 'lua',
  r: 'r',
  pl: 'perl',
  diff: 'diff',
  patch: 'diff',
  graphql: 'graphql',
  gql: 'graphql',
}

/**
 * Maps a filename to a highlight.js language name. Returns undefined when the
 * extension isn't recognized (callers fall back to auto-detection).
 */
export function languageFromFilename(filename?: string): string | undefined {
  if (!filename) return undefined
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const lang = EXT_TO_LANG[ext]
  return lang && lowlight.registered(lang) ? lang : undefined
}

function scopeFromClassName(className: unknown): string | undefined {
  if (!Array.isArray(className)) return undefined
  const parts = className.map(String)
  const hljs = parts.find(c => c.startsWith('hljs-'))
  if (!hljs) return undefined
  // e.g. ['hljs-title', 'function_'] -> 'title.function_'
  return [hljs.slice(5), ...parts.filter(c => c !== hljs)].join('.')
}

function flatten(
  nodes: RootContent[],
  inherited: string | undefined,
  out: Span[],
): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push({scope: inherited, value: node.value})
    } else if (node.type === 'element') {
      const scope = scopeFromClassName(node.properties?.className) ?? inherited
      flatten(node.children, scope, out)
    }
  }
}

/** Highlights `code` and splits it into lines of scoped spans. */
export function highlightToLines(code: string, language?: string): Line[] {
  let tree: Root
  try {
    tree =
      language && lowlight.registered(language)
        ? lowlight.highlight(language, code)
        : lowlight.highlightAuto(code)
  } catch {
    // Unknown language or highlighter error: render as plain text.
    tree = {type: 'root', children: [{type: 'text', value: code}]}
  }

  const spans: Span[] = []
  flatten(tree.children, undefined, spans)

  const lines: Line[] = [[]]
  for (const span of spans) {
    const parts = span.value.split('\n')
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([])
      if (part) lines[lines.length - 1].push({scope: span.scope, value: part})
    })
  }
  return lines
}
