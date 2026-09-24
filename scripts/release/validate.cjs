const assert = require('node:assert/strict')
const {readFileSync} = require('node:fs')
const {resolve} = require('node:path')

const [source, version, stage] = process.argv.slice(2)
assert.match(version, /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/)
const root = resolve(source)
assert.equal(
  require(`${root}/package.json`).version,
  version,
  'Package version mismatch',
)
for (const platform of ['ios', 'android', 'web']) {
  process.env.EXPO_PUBLIC_ENV = 'production'
  process.env.EAS_BUILD_PLATFORM = platform
  const {expo} = require(`${root}/app.config.js`)({})
  assert.equal(expo.version, version, `${platform}: Expo version mismatch`)
  assert.equal(
    expo.runtimeVersion?.policy,
    'appVersion',
    `${platform}: unsupported runtime policy`,
  )
}
if (stage === 'prepared') {
  const document = readFileSync(`${root}/RELEASE-${version}.md`, 'utf8')
  const prefix = `---\nreleaseVersion: ${version}\n---\n\n# Release ${version}\n\n<!-- public-changelog:start -->\n\n## Initial release\n\n`
  const suffix = '\n\n<!-- public-changelog:end -->\n'
  assert.ok(
    document.startsWith(prefix) && document.endsWith(suffix),
    'Invalid prepared release document',
  )
  const notes = document.slice(prefix.length, -suffix.length)
  assert.ok(notes.trim(), 'Empty release notes')
  assert.ok(!/^## /m.test(notes), 'Unexpected release section')
  assert.ok(
    !notes.includes('<!-- public-changelog:'),
    'Duplicate changelog markers',
  )
}
