/**
 * Turns the profile BaselineProfileGenerator recorded into profiles/app.txt.
 *
 * Every method rule is marked hot, startup and post-startup (HSP). ART only
 * marks a few of the methods it records as hot, and Android 14 and older only
 * compile hot methods at install, so most of a profile left as recorded would
 * do nothing there. Rules are sorted so updates produce readable diffs.
 *
 * Usage:
 *   node plugins/androidBaselineProfile/updateProfile.mjs [<recorded profile>...]
 *
 * Without arguments, it uses the most recent profile in the benchmark module's
 * outputs. With several, for example from several devices, it merges them.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(ROOT, 'profiles/app.txt')
const RECORDED = path.join(
  ROOT,
  'benchmark/build/outputs/connected_android_test_additional_output',
)
// Optional flags followed by a class descriptor, e.g.
// `HSPLcom/facebook/react/ReactHost;->start()V` or `Lcom/facebook/yoga/YogaNode;`
const RULE = /^([HSP]*)(L[^;]+;)(.*)$/

/** @returns {string} */
function findRecordedProfile() {
  /** @type {string[]} */
  const found = []
  /** @param {string} dir */
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
      } else if (
        entry.name.startsWith('BaselineProfileGenerator_') &&
        entry.name.endsWith('-baseline-prof.txt')
      ) {
        found.push(entryPath)
      }
    }
  }
  if (fs.existsSync(RECORDED)) {
    visit(RECORDED)
  }
  if (found.length === 0) {
    throw new Error(
      `No recorded profile under ${RECORDED}. Run pnpm android:baseline-profile first.`,
    )
  }
  return found.sort(
    (a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs,
  )[0]
}

const recorded = process.argv.slice(2)
if (recorded.length === 0) {
  recorded.push(findRecordedProfile())
}

/** @type {Map<string, [string, string]>} Rule to its class descriptor and member */
const rules = new Map()
for (const file of recorded) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = RULE.exec(line.trim())
    if (match == null) {
      continue
    }
    const [, , descriptor, member] = match
    const rule = member === '' ? descriptor : `HSP${descriptor}${member}`
    rules.set(rule, [descriptor, member])
  }
}

// R8 renames almost every class, so nothing recorded from a minified build would match
if (
  ![...rules.keys()].some(rule =>
    rule.startsWith('HSPLcom/facebook/react/ReactActivity;'),
  )
) {
  throw new Error(
    `${recorded.join(', ')} has no rules for ReactActivity. Was it recorded from a minified build? Pass -Pbsky.benchmark.minify=false.`,
  )
}

// Each class rule first, followed by its method rules
const compare = (/** @type {string} */ a, /** @type {string} */ b) =>
  a < b ? -1 : a > b ? 1 : 0
const sorted = [...rules]
  .sort(
    ([, [classA, memberA]], [, [classB, memberB]]) =>
      compare(classA, classB) || compare(memberA, memberB),
  )
  .map(([rule]) => rule)
fs.writeFileSync(OUTPUT, sorted.join('\n') + '\n')

const methods = sorted.filter(rule => rule.includes('->')).length
console.log(
  `Wrote ${sorted.length} rules (${sorted.length - methods} classes, ${methods} methods) to ${path.relative(process.cwd(), OUTPUT)}`,
)
