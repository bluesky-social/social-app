/* oxlint-disable import/no-nodejs-modules -- This suite exercises a Node CLI with temporary Git repositories. */
import {execFileSync, spawnSync} from 'node:child_process'
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'

const cli = resolve('scripts/release/prepare.mjs')
let directory
let source

function git(...args) {
  return execFileSync('git', ['-C', source, ...args], {encoding: 'utf8'}).trim()
}

function run(version = '1.2.3', output) {
  return spawnSync(
    process.execPath,
    [cli, version, source, ...(output ? [output] : [])],
    {encoding: 'utf8'},
  )
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'release-dry-run-'))
  source = join(directory, 'source')
  execFileSync('git', ['init', '--quiet', source])
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('config', 'commit.gpgsign', 'false')
  git('config', 'tag.gpgsign', 'false')
  git('config', 'core.hooksPath', '/dev/null')
  writeFileSync(join(source, 'package.json'), '{"version":"1.2.3"}')
  writeFileSync(
    join(source, 'app.config.js'),
    "module.exports = () => ({expo: {version: '1.2.3', runtimeVersion: {policy: 'appVersion'}}})",
  )
  git('add', '.')
  git('commit', '--quiet', '-m', 'Old change')
  git('tag', '1.2.2')
  writeFileSync(join(source, 'change.txt'), 'change')
  git('add', '.')
  git('commit', '--quiet', '-m', 'New change')
})

afterEach(() => rmSync(directory, {recursive: true, force: true}))

test('reads real history and saves notes without changing source or refs; repeats safely', () => {
  const before = [
    git('rev-parse', 'HEAD'),
    git('show-ref'),
    git('status', '--porcelain'),
  ]
  const output = join(directory, 'report')
  const result = run('1.2.3', output)
  expect(result.status).toBe(0)
  expect(result.stdout).toContain(before[0])
  expect(result.stdout).toContain('release-1.2.3')
  expect(
    JSON.parse(readFileSync(join(output, 'report.json'), 'utf8')),
  ).toMatchObject({
    mode: 'dry-run',
    sourceSha: before[0],
    previousTag: '1.2.2',
    publicChangelog: '## Initial release\n\n- New change',
  })
  expect(
    readFileSync(join(output, 'github-release-body.md'), 'utf8'),
  ).not.toContain('releaseVersion:')
  expect(run().stdout).toBe(result.stdout)
  expect(run('1.2.3', output).status).toBe(1)
  expect([
    git('rev-parse', 'HEAD'),
    git('show-ref'),
    git('status', '--porcelain'),
  ]).toEqual(before)
})

test('rejects invalid and mismatched versions before writing a report', () => {
  expect(run('01.2.3').stderr).toContain('strict x.y.z')
  expect(run('1.2.4').stderr).toContain('package version is 1.2.3')
  expect(run('--apply').status).toBe(1)
})

test('rejects changed source instead of claiming it matches the commit', () => {
  writeFileSync(join(source, 'change.txt'), 'uncommitted')
  expect(run().stderr).toContain('tracked changes')
})

test('rejects a different runtime policy', () => {
  writeFileSync(
    join(source, 'app.config.js'),
    "module.exports = () => ({expo: {version: '1.2.3', runtimeVersion: {policy: 'fingerprint'}}})",
  )
  git('add', '.')
  git('commit', '--quiet', '-m', 'Change runtime')
  expect(run().stderr).toContain('runtimeVersion.policy')
})

test('uses reachable history when there is no previous version tag', () => {
  git('tag', '-d', '1.2.2')
  expect(run().stdout).toContain('- Old change')
  expect(run().stdout).toContain('none (using all reachable history)')
})

test('rejects shallow history instead of generating incomplete notes', () => {
  const clone = join(directory, 'shallow')
  execFileSync('git', [
    'clone',
    '--quiet',
    '--depth=1',
    `file://${source}`,
    clone,
  ])
  source = clone
  expect(run().stderr).toContain('Full Git history')
})
