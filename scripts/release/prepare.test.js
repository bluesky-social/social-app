/* oxlint-disable import/no-nodejs-modules -- This suite exercises a Node CLI and temporary report files. */
import {spawnSync} from 'node:child_process'
import {mkdtempSync, readdirSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const moduleUrl = pathToFileURL(resolve('scripts/release/prepare.mjs')).href
const demoUrl = pathToFileURL(resolve('scripts/release/prepare-demo.mjs')).href
const input = {
  releaseVersion: '1.133.0',
  sourceSha: 'a'.repeat(40),
  packageVersion: '1.133.0',
  expoVersion: '1.133.0',
  runtimeVersion: '1.133.0',
  changelog: '- A change',
}

/**
 * Run the actual ESM modules without applying the app's Babel transforms.
 * @returns {{value?: unknown, error?: string}}
 */
function evaluate(code, data = {}) {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import {readFileSync} from 'node:fs'
    import {planPreparation, simulatePreparation} from ${JSON.stringify(moduleUrl)}
    import {runDemo, renderReport} from ${JSON.stringify(demoUrl)}
    const data = JSON.parse(readFileSync(0, 'utf8'))
    try {
      const value = (() => { ${code} })()
      process.stdout.write(JSON.stringify({value}))
    } catch (error) {
      process.stdout.write(JSON.stringify({error: error.message}))
    }
  `,
    ],
    {encoding: 'utf8', input: JSON.stringify(data)},
  )
  if (result.status !== 0) throw new Error(result.stderr)
  return JSON.parse(result.stdout)
}

test('the self-checking demo produces deterministic reviewer evidence', () => {
  expect(
    evaluate(
      'return JSON.stringify(runDemo()) === JSON.stringify(runDemo()) && renderReport(runDemo()) === renderReport(runDemo())',
    ),
  ).toEqual({value: true})
})

test('rejects noncanonical release versions', () => {
  expect(
    evaluate('return planPreparation(data)', {
      ...input,
      releaseVersion: '01.2.3',
    }).error,
  ).toContain('strict x.y.z')
})

test('requires a resolved commit instead of a mutable branch name', () => {
  expect(
    evaluate('return planPreparation(data)', {...input, sourceSha: 'main'})
      .error,
  ).toContain('resolved full commit SHA')
})

test('an invalid generated changelog is rejected before planning resources', () => {
  expect(
    evaluate('return planPreparation(data)', {
      ...input,
      changelog: '- Change\n\n## Unsupported\n\n- Hidden content',
    }).error,
  ).toContain('Unsupported public changelog section')
})

test('draft body excludes operational metadata and delimiters', () => {
  expect(
    evaluate(
      `
    const plan = planPreparation(data)
    return {body: plan.publicChangelog, name: plan.identity.githubReleaseName, idIsSimulated: plan.candidateId.startsWith('simulation:')}
  `,
      input,
    ),
  ).toEqual({
    value: {
      body: '## Initial release\n\n- A change',
      name: 'Release 1.133.0',
      idIsSimulated: true,
    },
  })
})

test('simulation isolates caller snapshots from subsequent changes', () => {
  expect(
    evaluate(
      `
      const original = simulatePreparation(data, {}, {stopAfter: 1}).state
      const before = JSON.stringify(original)
      const resumed = simulatePreparation(data, original)
      resumed.state.candidate.document = 'edited output'
      return JSON.stringify(original) === before
    `,
      input,
    ),
  ).toEqual({value: true})
})

test('CLI writes only reviewer files, refuses overwrite, and has no live mode', () => {
  const directory = mkdtempSync(join(tmpdir(), 'release-prep-demo-'))
  const demo = resolve('scripts/release/prepare-demo.mjs')
  const output = join(directory, 'report')
  const run = args =>
    spawnSync(process.execPath, [demo, ...args], {
      cwd: directory,
      encoding: 'utf8',
    })
  try {
    expect(run(['--output', output]).status).toBe(0)
    expect(readdirSync(output).sort()).toEqual([
      'README.md',
      'RELEASE-1.133.0.md',
      'github-release-body.md',
      'report.json',
    ])
    const before = readFileSync(join(output, 'report.json'), 'utf8')
    expect(run(['--output', output]).status).toBe(1)
    expect(readFileSync(join(output, 'report.json'), 'utf8')).toBe(before)
    expect(run(['--apply']).status).toBe(1)
    expect(readdirSync(directory)).toEqual(['report'])
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})
