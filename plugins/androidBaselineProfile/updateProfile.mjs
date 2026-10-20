/**
 * Turns the profiles BaselineProfileGenerator recorded into profiles/app.txt
 * and profiles/startup-prof.txt.
 *
 * app.txt is the Baseline Profile, which ART compiles ahead of time. It gets
 * every recorded rule, because AGP leaves startup-prof.txt out of it.
 * startup-prof.txt is the startup profile, which R8 uses to put startup code
 * first in the primary dex file. It only gets what the startup journey
 * recorded (files ending in -startup-prof.txt).
 *
 * Every method rule is marked hot, startup and post-startup (HSP). ART only
 * marks a few of the methods it records as hot, and Android 14 and older only
 * compile hot methods at install, so most of a profile left as recorded would
 * do nothing there. Rules are sorted so updates produce readable diffs.
 *
 * Usage:
 *   node plugins/androidBaselineProfile/updateProfile.mjs [<recorded profile>...]
 *
 * Without arguments, it uses what the last run of BaselineProfileGenerator
 * recorded. With several from one journey, for example from several devices,
 * it merges them.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PROFILES = path.join(ROOT, 'profiles')
const RECORDED = path.join(
  ROOT,
  'benchmark/build/outputs/connected_android_test_additional_output',
)
// Optional flags followed by a class descriptor, e.g.
// `HSPLcom/facebook/react/ReactHost;->start()V` or `Lcom/facebook/yoga/YogaNode;`
const RULE = /^([HSP]*)(L[^;]+;)(.*)$/
// BaselineProfileRule also writes a copy of each with a timestamp, which this skips
const RECORDED_PROFILE =
  /^BaselineProfileGenerator_.*-(baseline|startup)-prof\.txt$/

/** @returns {string[]} */
function findRecordedProfiles() {
  /** @type {string[]} */
  const found = []
  /** @param {string} dir */
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
      } else if (RECORDED_PROFILE.test(entry.name)) {
        found.push(entryPath)
      }
    }
  }
  if (fs.existsSync(RECORDED)) {
    visit(RECORDED)
  }
  if (found.length === 0) {
    throw new Error(
      `No recorded profiles under ${RECORDED}. Run pnpm android:baseline-profile first.`,
    )
  }
  return found
}

/**
 * @param {string[]} files
 * @returns {string[]} The rules, marked HSP and sorted
 */
function readRules(files) {
  /** @type {Map<string, [string, string]>} Rule to its class descriptor and member */
  const rules = new Map()
  for (const file of files) {
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
      `${files.join(', ')} has no rules for ReactActivity. Was it recorded from a minified build? Pass -Pbsky.benchmark.minify=false.`,
    )
  }

  // Each class rule first, followed by its method rules
  const compare = (/** @type {string} */ a, /** @type {string} */ b) =>
    a < b ? -1 : a > b ? 1 : 0
  return [...rules]
    .sort(
      ([, [classA, memberA]], [, [classB, memberB]]) =>
        compare(classA, classB) || compare(memberA, memberB),
    )
    .map(([rule]) => rule)
}

/**
 * @param {string} name
 * @param {string[]} files
 */
function write(name, files) {
  const rules = readRules(files)
  const output = path.join(PROFILES, name)
  fs.writeFileSync(output, rules.join('\n') + '\n')
  const methods = rules.filter(rule => rule.includes('->')).length
  console.log(
    `Wrote ${rules.length} rules (${rules.length - methods} classes, ${methods} methods) to ${path.relative(process.cwd(), output)}`,
  )
}

const recorded = process.argv.slice(2)
if (recorded.length === 0) {
  recorded.push(...findRecordedProfiles())
}
const startup = recorded.filter(file => file.endsWith('-startup-prof.txt'))
write('app.txt', recorded)
if (startup.length > 0) {
  write('startup-prof.txt', startup)
}
