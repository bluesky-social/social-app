#!/usr/bin/env node
/**
 * Reports which components and hooks React Compiler skipped optimizing.
 *
 * The Babel plugin exposes a `logger` option that emits one event per function
 * `compilationMode: 'infer'` selected: CompileSuccess when it compiled the
 * function, CompileError when it skipped it, and CompileSkip when the function
 * opted out of compilation with a `'use no memo'` directive. Running the plugin
 * standalone over src and tallying those events is the whole report.
 *
 * Diagnostics are grouped by the compiler's own ErrorCategory. Severity says who
 * owns the fix: `Error` is code the compiler cannot safely optimize, `Hint` is a
 * `Todo`, i.e. syntax React Compiler does not support yet.
 *
 * `react-compiler-healthcheck` does roughly this, but its severity classifier
 * still expects the pre-1.0 ErrorSeverity members and throws on every real
 * severity, into an empty catch. That silently drops the rest of each file, so
 * it reports 100% compiled on any codebase. Hence our own.
 *
 * Usage:  node scripts/react-compiler-report.ts
 * Runs under Node's type stripping, so keep the syntax erasable - no enums, no
 * namespaces, and type-only imports must say `import type`.
 *
 * Prints the same report to stdout and, under GitHub Actions, to the job
 * summary. Always exits 0 - this is a metric, not a gate.
 */

import {appendFileSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {transformSync} from '@babel/core'
import {
  type ErrorCategory,
  type ErrorSeverity,
  type Logger,
} from 'babel-plugin-react-compiler'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OPT_OUT_DIRECTIVE = "'use no memo'"

/** A component or hook, as `path/to/File.tsx:12`. */
type FunctionKey = string

type Diagnostic = {
  category: ErrorCategory
  severity: ErrorSeverity
  reason: string
}

const files: string[] = []
;(function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry !== '__tests__') walk(path)
    } else if (/\.[jt]sx?$/.test(entry) && !/\.d\.ts$|\.test\./.test(entry)) {
      files.push(path)
    }
  }
})(join(ROOT, 'src'))
files.sort()

const compiled = new Set<FunctionKey>()
const skipped = new Map<FunctionKey, Diagnostic[]>()
const optedOut = new Set<FunctionKey>()
/** Files the plugin could not process at all, e.g. syntax it cannot parse. */
const unreadable: [file: string, message: string][] = []
let currentFile: string | null = null

const logger: Logger = {
  logEvent(_filename, event) {
    if (!('fnLoc' in event) || event.fnLoc == null) return
    const key = `${relative(ROOT, currentFile!)}:${event.fnLoc.start.line}`
    if (event.kind === 'CompileSuccess') {
      compiled.add(key)
    } else if (event.kind === 'CompileSkip') {
      optedOut.add(key)
    } else if (event.kind === 'CompileError') {
      /*
       * One function emits one event per diagnostic, so collect them per
       * location - counting raw events overstates the number of skipped
       * components and hooks by roughly 40%.
       */
      if (!skipped.has(key)) skipped.set(key, [])
      skipped.get(key)!.push({
        category: event.detail.category,
        severity: event.detail.severity,
        reason: event.detail.reason,
      })
    }
  },
}

for (const file of files) {
  currentFile = file
  try {
    transformSync(readFileSync(file, 'utf8'), {
      filename: file,
      babelrc: false,
      configFile: false,
      sourceType: 'module',
      parserOpts: {
        plugins: [
          /\.tsx?$/.test(file) && 'typescript',
          /x$/.test(file) && 'jsx',
        ].filter(Boolean) as ('typescript' | 'jsx')[],
      },
      plugins: [
        /*
         * Must run before the compiler, mirroring babel.config.js. Without it
         * every l`...` macro reads as unsupported tagged template syntax and the
         * number of skipped components and hooks roughly doubles.
         */
        '@lingui/babel-plugin-lingui-macro',
        ['babel-plugin-react-compiler', {target: '19', logger}],
      ],
      generatorOpts: {compact: true},
    })
  } catch (err) {
    /*
     * A skipped function does not throw - panicThreshold defaults to 'none' - so
     * this is the plugin itself failing. Report it rather than exiting, so a
     * metric can never block the check it runs alongside.
     */
    unreadable.push([
      relative(ROOT, file),
      (err as Error).message.split('\n')[0],
    ])
  }
}

/* A function often reports the same diagnostic several times; show it once. */
for (const [key, diagnostics] of skipped) {
  const unique = new Map(diagnostics.map(d => [`${d.category} ${d.reason}`, d]))
  skipped.set(key, [...unique.values()])
}

const rows = [...skipped].sort(([a], [b]) => a.localeCompare(b))
const selected = compiled.size + rows.length + optedOut.size
const affectedFiles = new Set(
  [...rows.map(([key]) => key), ...optedOut].map(key => key.split(':')[0]),
)

/** Categories ranked by how many components and hooks each one skipped. */
const byCategory = new Map<
  ErrorCategory,
  {severity: ErrorSeverity; count: number}
>()
for (const [, diagnostics] of rows) {
  for (const d of new Map(diagnostics.map(d => [d.category, d])).values()) {
    const entry = byCategory.get(d.category) ?? {severity: d.severity, count: 0}
    entry.count++
    byCategory.set(d.category, entry)
  }
}
const ranked = [...byCategory].sort((a, b) => b[1].count - a[1].count)

const headline = `Successfully compiled ${compiled.size} out of ${selected} components and hooks.`
const subhead =
  `${rows.length} skipped, ${optedOut.size} opted out of compilation ` +
  `(${OPT_OUT_DIRECTIVE}), across ${affectedFiles.size} files.`

for (const [key, diagnostics] of rows) {
  console.log(key)
  for (const d of diagnostics) console.log(`    ${d.category}: ${d.reason}`)
}
for (const key of [...optedOut].sort()) {
  console.log(`${key}\n    CompileSkip: opted out via ${OPT_OUT_DIRECTIVE}`)
}
console.log()
for (const [category, {severity, count}] of ranked) {
  console.log(`${String(count).padStart(4)}  ${category} (${severity})`)
}
console.log(`\n${headline}\n${subhead}`)
for (const [file, message] of unreadable) {
  console.log(
    `::warning file=${file}::React Compiler could not run: ${message}`,
  )
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY
if (summaryPath) {
  appendFileSync(
    summaryPath,
    [
      `## React Compiler`,
      ``,
      `**${headline}** ${subhead}`,
      ``,
      `| category | severity | components and hooks |`,
      `| --- | --- | --- |`,
      ...ranked.map(
        ([category, {severity, count}]) =>
          `| ${category} | ${severity} | ${count} |`,
      ),
      ``,
      `\`Hint\` is a \`Todo\`: syntax React Compiler does not support yet.`,
      `\`Error\` is code the compiler cannot safely optimize.`,
      ``,
      `<details><summary>All ${rows.length + optedOut.size} skipped components and hooks</summary>`,
      ``,
      ...rows.map(
        ([key, diagnostics]) =>
          `- \`${key}\` - ${diagnostics.map(d => `${d.category}: ${d.reason}`).join('; ')}`,
      ),
      ...[...optedOut]
        .sort()
        .map(
          key =>
            `- \`${key}\` - CompileSkip: opted out via ${OPT_OUT_DIRECTIVE}`,
        ),
      ``,
      `</details>`,
      ``,
    ].join('\n'),
  )
}
