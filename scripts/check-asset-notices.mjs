#!/usr/bin/env node
/**
 * Verifies that every path named in ASSETS.md and NOTICE.md still exists.
 *
 * These two files tell forkers which assets our MIT license does not cover. If a file moves or
 * is renamed and the notice is not updated, the notice quietly stops meaning anything — which is
 * the failure mode that produced the problem in the first place. This check makes that loud.
 *
 * Usage:  node scripts/check-asset-notices.mjs
 * Exits 1 if any referenced path is missing.
 */

import {readFileSync, existsSync, readdirSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCES = ['ASSETS.md', 'NOTICE.md']

/** Tokens that look like paths but are not: package names, URLs, prose. */
const NOT_A_PATH = /^(https?:|@|[A-Z_]+$)/

/** Extract `backticked` tokens that are plausibly repo paths. */
function extractPaths(markdown) {
  const out = new Set()
  for (const [, token] of markdown.matchAll(/`([^`\n]+)`/g)) {
    const t = token.trim()
    // Only validate tokens that are unambiguously repo-relative paths. Bare filenames that
    // appear in comma-separated lists ("`bskyweb/static/favicon.png`, `favicon-16x16.png`")
    // are reported separately rather than guessed at.
    if (!t.includes('/') || NOT_A_PATH.test(t) || t.includes(' ')) continue
    out.add(t.replace(/^\.\//, ''))
  }
  return [...out]
}

/** Resolve a path that may end in `/` (directory) or contain a single `*` glob segment. */
function pathExists(p) {
  const full = join(ROOT, p)
  if (existsSync(full)) return true
  if (!p.includes('*')) return false

  // Handle one glob in the final segment, e.g. bskyweb/static/media/MaterialIcons.*.ttf
  const dir = dirname(full)
  const pattern = p.split('/').pop()
  if (!existsSync(dir)) return false
  const re = new RegExp(
    '^' +
      pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
      '$',
  )
  return readdirSync(dir).some(f => re.test(f))
}

let missing = 0
let checked = 0
const skipped = new Set()

for (const source of SOURCES) {
  const file = join(ROOT, source)
  if (!existsSync(file)) {
    console.error(`✗ ${source} is missing`)
    missing++
    continue
  }
  const markdown = readFileSync(file, 'utf8')

  for (const [, token] of markdown.matchAll(/`([^`\n]+)`/g)) {
    const t = token.trim()
    if (!t.includes('/') && /\.[a-z0-9]{2,5}$/i.test(t)) skipped.add(t)
  }

  for (const p of extractPaths(markdown)) {
    checked++
    if (!pathExists(p)) {
      console.error(`✗ ${source} references a path that does not exist: ${p}`)
      missing++
    }
  }
}

console.log(`Checked ${checked} referenced paths across ${SOURCES.join(', ')}.`)

if (skipped.size) {
  console.log(
    `Note: ${skipped.size} bare filename(s) not verified (they are relative to a nearby path): ` +
      [...skipped].sort().join(', '),
  )
}

if (missing) {
  console.error(
    `\n${missing} problem(s) found. An asset named in a licensing notice has moved or been ` +
      `removed. Update the notice — do not just silence this check.`,
  )
  process.exit(1)
}

console.log('All referenced paths exist.')
