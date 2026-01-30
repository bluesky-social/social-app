const path = require('path')
const fs = require('fs')
const {execSync} = require('child_process')

const projectRoot = path.join(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const bskywebStatic = path.join(projectRoot, 'bskyweb', 'static')
const templateFile = path.join(
  projectRoot,
  'bskyweb',
  'templates',
  'scripts.html',
)

// Parse dist/index.html for entrypoint scripts and stylesheets injected by Metro.
// Metro injects <link rel="preload/stylesheet"> and <script> tags referencing /_expo/static/ paths.
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')

// Find all CSS stylesheet links pointing to _expo
const cssEntries = []
const cssRegex = /<link\b[^>]*href="(\/_expo\/static\/css\/[^"]+)"[^>]*>/g
let match
while ((match = cssRegex.exec(indexHtml)) !== null) {
  if (
    indexHtml
      .substring(match.index, match.index + match[0].length)
      .includes('stylesheet')
  ) {
    cssEntries.push(match[1])
  }
}

// Find all script src entries pointing to _expo
const jsEntries = []
const jsRegex = /<script\b[^>]*src="(\/_expo\/static\/js\/[^"]+)"[^>]*>/g
while ((match = jsRegex.exec(indexHtml)) !== null) {
  jsEntries.push(match[1])
}

console.log(`Found ${jsEntries.length} script entrypoints`)
console.log(`Found ${cssEntries.length} CSS entrypoints`)

// Generate scripts.html template
// Map /_expo/static/... to {{ staticCDNHost }}/static/...
const outputLines = []

for (const href of cssEntries) {
  const cdnPath = href.replace(
    /^\/_expo\/static\//,
    '{{ staticCDNHost }}/static/',
  )
  outputLines.push(`<link rel="stylesheet" href="${cdnPath}">`)
}

for (const src of jsEntries) {
  const cdnPath = src.replace(
    /^\/_expo\/static\//,
    '{{ staticCDNHost }}/static/',
  )
  outputLines.push(`<script defer="defer" src="${cdnPath}"></script>`)
}

console.log(`Writing ${templateFile}`)
fs.writeFileSync(templateFile, outputLines.join('\n'))

// Clean previous build output to avoid stale files
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, {recursive: true})
    console.log(`Cleaned ${dir}`)
  }
}

cleanDir(path.join(bskywebStatic, 'js', 'web'))
cleanDir(path.join(bskywebStatic, 'css'))
cleanDir(path.join(bskywebStatic, 'assets'))

// Recursively copy a directory, skipping source map files
function copyDir(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`Skipping ${sourceDir} (does not exist)`)
    return
  }
  fs.mkdirSync(targetDir, {recursive: true})
  const entries = fs.readdirSync(sourceDir, {withFileTypes: true})
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
    } else if (!entry.name.endsWith('.map')) {
      fs.copyFileSync(sourcePath, targetPath)
      console.log(`Copied ${sourcePath} to ${targetPath}`)
    }
  }
}

// Copy JS chunks
copyDir(
  path.join(distDir, '_expo', 'static', 'js', 'web'),
  path.join(bskywebStatic, 'js', 'web'),
)

// Copy CSS
copyDir(
  path.join(distDir, '_expo', 'static', 'css'),
  path.join(bskywebStatic, 'css'),
)

// Copy assets (fonts, images, icons, etc.)
copyDir(path.join(distDir, 'assets'), path.join(bskywebStatic, 'assets'))

// Upload source maps to Sentry
if (process.env.SENTRY_AUTH_TOKEN) {
  const release =
    process.env.SENTRY_RELEASE ||
    require(path.join(projectRoot, 'package.json')).version
  const dist = process.env.SENTRY_DIST || undefined
  const sourceMapDir = path.join(distDir, '_expo', 'static')

  console.log(`Uploading source maps to Sentry (release: ${release})`)
  const cmd = [
    'sentry-cli',
    'sourcemaps',
    'upload',
    '--org',
    'blueskyweb',
    '--project',
    'app',
    '--release',
    release,
    ...(dist ? ['--dist', dist] : []),
    sourceMapDir,
  ]
  try {
    execSync(cmd.join(' '), {stdio: 'inherit', cwd: projectRoot})
    console.log('Sentry source map upload complete')
  } catch (e) {
    console.error('Sentry source map upload failed:', e.message)
    process.exit(1)
  }
} else {
  console.log('Skipping Sentry source map upload (SENTRY_AUTH_TOKEN not set)')
}
