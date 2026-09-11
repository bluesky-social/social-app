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
 * Prints the report to stdout, and writes a markdown version to the job
 * summary under GitHub Actions and to REACT_COMPILER_REPORT_PATH when set
 * (the React Compiler report workflow posts that file as a sticky PR
 * comment). Always exits 0 - this is a metric, not a gate.
 *
 * The workflow also diffs each PR against its base commit:
 * REACT_COMPILER_SRC_ROOT points the script at another checkout,
 * REACT_COMPILER_SNAPSHOT_PATH writes a JSON snapshot of every function's
 * status, and REACT_COMPILER_BASE_SNAPSHOT_PATH reads such a snapshot back to
 * report which components lost or regained optimization.
 */

import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {transformSync} from '@babel/core'
import {
  type ErrorCategory,
  type ErrorSeverity,
  type Logger,
} from 'babel-plugin-react-compiler'

/**
 * Root of the tree to analyze. Defaults to this repo; the report workflow sets
 * REACT_COMPILER_SRC_ROOT to a checkout of the PR's base commit so this
 * script (and this repo's node_modules) can snapshot the base too.
 */
const ROOT = process.env.REACT_COMPILER_SRC_ROOT
  ? resolve(process.env.REACT_COMPILER_SRC_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OPT_OUT_DIRECTIVE = "'use no memo'"

/** A component or hook, as `path/to/File.tsx:12`. */
type FunctionKey = string

/**
 * A component or hook as `path/to/File.tsx::Name` (`#n` disambiguates
 * same-named functions within one file). Snapshots are diffed on these keys
 * so a component merely pushed down by unrelated edits does not read as
 * having lost and regained optimization.
 */
type StableKey = string

type FunctionStatus = 'compiled' | 'skipped' | 'optedOut'

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
let currentSource: string | null = null

const status = new Map<StableKey, FunctionStatus>()
const locByStable = new Map<StableKey, FunctionKey>()
const stableByLoc = new Map<FunctionKey, StableKey>()
const stableNameCounts = new Map<string, number>()

/**
 * Best-effort function name from the declaration line - enough to tell
 * `function Foo`, `const useBar = ...`, and `name: () => ...` apart.
 */
function functionName(source: string, line: number): string {
  const text = source.split('\n')[line - 1] ?? ''
  const match =
    text.match(/function\s+([A-Za-z0-9_$]+)/) ??
    text.match(/(?:const|let|var)\s+([A-Za-z0-9_$]+)/) ??
    text.match(/^\s*(?:export\s+)?([A-Za-z0-9_$]+)\s*[:=(]/)
  return match?.[1] ?? 'anonymous'
}

const logger: Logger = {
  logEvent(_filename, event) {
    if (!('fnLoc' in event) || event.fnLoc == null) return
    const file = relative(ROOT, currentFile!)
    const key = `${file}:${event.fnLoc.start.line}`
    /*
     * One function can emit several events (one per diagnostic), so mint its
     * stable key once per location.
     */
    let stable = stableByLoc.get(key)
    if (!stable) {
      const name = `${file}::${functionName(currentSource!, event.fnLoc.start.line)}`
      const n = (stableNameCounts.get(name) ?? 0) + 1
      stableNameCounts.set(name, n)
      stable = n > 1 ? `${name}#${n}` : name
      stableByLoc.set(key, stable)
      locByStable.set(stable, key)
    }
    if (event.kind === 'CompileSuccess') {
      compiled.add(key)
      status.set(stable, 'compiled')
    } else if (event.kind === 'CompileSkip') {
      optedOut.add(key)
      status.set(stable, 'optedOut')
    } else if (event.kind === 'CompileError') {
      status.set(stable, 'skipped')
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
  currentSource = readFileSync(file, 'utf8')
  try {
    transformSync(currentSource, {
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

/** Share of selected components and hooks compiled, as e.g. `95.3%`. */
function percent(n: number, of: number): string {
  return `${of ? ((n / of) * 100).toFixed(1) : '0.0'}%`
}

const headline = `Successfully compiled ${compiled.size} out of ${selected} components and hooks (${percent(compiled.size, selected)}).`
const subhead =
  `${rows.length} skipped, ${optedOut.size} opted out of compilation ` +
  `(${OPT_OUT_DIRECTIVE}), across ${affectedFiles.size} files.`

type Snapshot = {
  compiled: number
  selected: number
  functions: Record<StableKey, FunctionStatus>
}

/*
 * Snapshot/diff wiring for the React Compiler report workflow: the run over
 * the PR's base commit writes a snapshot, then the PR run diffs itself
 * against it so the sticky comment can call out components that lost or
 * regained optimization.
 */
const snapshotPath = process.env.REACT_COMPILER_SNAPSHOT_PATH
if (snapshotPath) {
  const snapshot: Snapshot = {
    compiled: compiled.size,
    selected,
    functions: Object.fromEntries(
      [...status].sort(([a], [b]) => a.localeCompare(b)),
    ),
  }
  try {
    writeFileSync(snapshotPath, JSON.stringify(snapshot))
  } catch (err) {
    console.log(
      `::warning::Could not write the snapshot: ${(err as Error).message}`,
    )
  }
}

/*
 * A metric must never fail the build, so an unreadable snapshot just means no
 * diff and a warning rather than a non-zero exit.
 */
const baseSnapshotPath = process.env.REACT_COMPILER_BASE_SNAPSHOT_PATH
let base: Snapshot | null = null
if (baseSnapshotPath && existsSync(baseSnapshotPath)) {
  try {
    base = JSON.parse(readFileSync(baseSnapshotPath, 'utf8'))
  } catch (err) {
    console.log(
      `::warning::Ignoring unreadable base snapshot: ${(err as Error).message}`,
    )
  }
}

const lost: StableKey[] = []
const regained: StableKey[] = []
if (base) {
  for (const [stable, s] of status) {
    const was = base.functions[stable]
    if (s === 'compiled' && was && was !== 'compiled') regained.push(stable)
    if (s !== 'compiled' && was === 'compiled') lost.push(stable)
  }
  lost.sort()
  regained.sort()
}

/** A diff list entry: location, name, and why it is not compiled. */
function describeLost(stable: StableKey): string {
  const loc = locByStable.get(stable)!
  const diagnostics = skipped.get(loc)
  const reasons = diagnostics
    ? diagnostics.map(d => `${d.category}: ${d.reason}`).join('; ')
    : `CompileSkip: opted out via ${OPT_OUT_DIRECTIVE}`
  return `- \`${loc}\` \`${stable.split('::')[1]}\` - ${reasons}`
}

const diffSection = base
  ? [
      `**Compared to base** (${base.compiled} out of ${base.selected}, ${percent(base.compiled, base.selected)}):` +
        (lost.length || regained.length
          ? ''
          : ' no components changed optimization status.'),
      ``,
      ...(lost.length
        ? [
            `⚠️ **${lost.length} lost optimization:**`,
            ``,
            ...lost.map(describeLost),
            ``,
          ]
        : []),
      ...(regained.length
        ? [
            `✅ **${regained.length} regained optimization:**`,
            ``,
            ...regained.map(
              key => `- \`${locByStable.get(key)!}\` \`${key.split('::')[1]}\``,
            ),
            ``,
          ]
        : []),
    ]
  : []

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
if (base) {
  console.log(
    `\nCompared to base: ${lost.length} lost optimization, ${regained.length} regained.`,
  )
}
for (const [file, message] of unreadable) {
  console.log(
    `::warning file=${file}::React Compiler could not run: ${message}`,
  )
}

/*
 * The markdown report goes to the job summary when running under GitHub
 * Actions, and to REACT_COMPILER_REPORT_PATH when set - the React Compiler
 * report workflow posts that file as a sticky PR comment.
 */
const summaryPath = process.env.GITHUB_STEP_SUMMARY
const reportPath = process.env.REACT_COMPILER_REPORT_PATH
if (summaryPath || reportPath) {
  const markdown = [
    `## React Compiler`,
    ``,
    `**${headline}** ${subhead}`,
    ``,
    ...diffSection,
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
        key => `- \`${key}\` - CompileSkip: opted out via ${OPT_OUT_DIRECTIVE}`,
      ),
    ``,
    `</details>`,
    ``,
  ].join('\n')
  try {
    if (summaryPath) appendFileSync(summaryPath, markdown)
    if (reportPath) writeFileSync(reportPath, markdown)
  } catch (err) {
    console.log(
      `::warning::Could not write the markdown report: ${(err as Error).message}`,
    )
  }
}
