const path = require('path')
const fs = require('fs')
const {spawnSync} = require('child_process')

const projectRoot = path.join(__dirname, '..')
const outputDir = path.join(projectRoot, 'web-build')
const staticDir = path.join(projectRoot, 'bskyweb/static')
const html = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8')

/* Preserve the production source-map upload previously handled by Webpack. */
if (
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_AUTH_TOKEN !== 'unknown' &&
  process.env.SENTRY_DISABLE_AUTO_UPLOAD !== 'true'
) {
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('@sentry/react-native/scripts/expo-upload-sourcemaps.js'),
      outputDir,
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SENTRY_ORG: process.env.SENTRY_ORG || 'blueskyweb',
        SENTRY_PROJECT: process.env.SENTRY_PROJECT || 'app',
        SENTRY_URL: process.env.SENTRY_URL || 'https://sentry.io',
        SENTRY_RELEASE:
          process.env.SENTRY_RELEASE || require('../package.json').version,
      },
    },
  )
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('Sentry source-map upload failed')
}

/* Metro emits entry tags in index.html and loads additional chunks at runtime. */
const scripts = [
  ...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g),
].map(
  ([, src]) =>
    `<script defer="defer" src="{{ staticCDNHost }}${src}"></script>`,
)
const styles = [
  ...html.matchAll(
    /<link\b(?=[^>]*rel="stylesheet")(?=[^>]*href="([^"]+)")[^>]*>/g,
  ),
].map(([, href]) => `<link rel="stylesheet" href="{{ staticCDNHost }}${href}">`)
if (!scripts.length)
  throw new Error('Metro export did not contain an entry script')

fs.writeFileSync(
  path.join(projectRoot, 'bskyweb/templates/scripts.html'),
  [...styles, ...scripts].join('\n'),
)
for (const directory of ['_expo', 'assets']) {
  const source = path.join(outputDir, directory)
  if (fs.existsSync(source))
    fs.cpSync(source, path.join(staticDir, directory), {
      recursive: true,
      filter: file => !file.endsWith('.map'),
    })
}
console.log(
  `Copied Metro assets and ${scripts.length} entry script(s) into bskyweb`,
)

/* Keep the existing CI bundle-size comparison working across the migration. */
if (process.env.EXPO_PUBLIC_GENERATE_STATS === '1') {
  const entries = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(
    ([, src]) => src,
  )
  const size = entries.reduce(
    (total, entry) => total + fs.statSync(path.join(outputDir, entry)).size,
    0,
  )
  fs.writeFileSync(
    path.join(projectRoot, 'stats.json'),
    JSON.stringify({
      assets: [{name: 'main.js', size}],
      chunks: [],
      modules: [],
    }),
  )
}
