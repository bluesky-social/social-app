/*
 * Measures the initial payload of the exported web bundle.
 *
 * Reads index.html from the export directory, collects every local resource
 * referenced by <script src> / <link href> tags, sums their sizes plus the
 * size of index.html itself, and prints the total in bytes to stdout.
 * Per-file details go to stderr, so callers can do:
 *
 *   SIZE=$(node scripts/measure-web-bundle.js --exclude '\.ico$|\.woff2?$')
 *
 * Lazily-loaded chunks (locale messages, hls, etc.) are not referenced from
 * index.html and therefore do not count toward the total.
 *
 * The export directory is auto-detected: Metro exports to dist/, the old
 * webpack config exported to web-build/. This lets CI compare a Metro-built
 * PR against a webpack-built base commit with the same command; pass --dir
 * to override.
 */
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.join(__dirname, '..')

function usage() {
  console.error(
    'Usage: node scripts/measure-web-bundle.js [--dir <path>] [--exclude <regex>]... [--allow-missing]',
  )
  process.exit(1)
}

let dirArg = null
let allowMissing = false
const excludes = []
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--dir' && argv[i + 1]) {
    dirArg = argv[++i]
  } else if (argv[i] === '--exclude' && argv[i + 1]) {
    excludes.push(argv[++i])
  } else if (argv[i] === '--allow-missing') {
    allowMissing = true
  } else {
    usage()
  }
}

const candidates = dirArg
  ? [path.resolve(dirArg)]
  : [path.join(projectRoot, 'dist'), path.join(projectRoot, 'web-build')]
const outDir = candidates.find(dir => fs.existsSync(dir))
if (!outDir) {
  console.error(
    `Web build output not found (looked for ${candidates.join(', ')}). ` +
      'Run pnpm build-web first.',
  )
  process.exit(1)
}

const indexPath = path.join(outDir, 'index.html')
if (!fs.existsSync(indexPath)) {
  console.error(`${indexPath} not found. Run pnpm build-web first.`)
  process.exit(1)
}

const excludeRes = excludes.map(pattern => new RegExp(pattern))
const html = fs.readFileSync(indexPath, 'utf8')

/*
 * Every fetched-on-load resource is referenced via a src/href attribute on a
 * <script> or <link> tag. Inline url(...) references (e.g. the italic font in
 * the splash CSS) are fetched on demand, so they are intentionally skipped.
 */
const urls = new Set()
for (const match of html.matchAll(
  /<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g,
)) {
  urls.add(match[1])
}

/*
 * URLs are root-relative as served in production, where the export lives
 * under the app.config.js baseUrl ('/static'). On disk both '/static/foo'
 * and '/foo' resolve to '<outDir>/foo', so try the path with and without
 * the baseUrl prefix.
 */
function resolveLocal(url) {
  const rel = url.replace(/^\//, '')
  for (const candidate of [rel, rel.replace(/^static\//, '')]) {
    const abs = path.join(outDir, candidate)
    if (fs.existsSync(abs)) return {rel: candidate, abs}
  }
  return null
}

let total = fs.statSync(indexPath).size
let count = 1
console.error(`${String(total).padStart(12)}  index.html`)

for (const url of [...urls].sort()) {
  if (/^(?:https?:)?\/\//.test(url) || url.startsWith('data:')) continue
  const resolved = resolveLocal(url)
  if (!resolved) {
    /*
     * By default fail loudly: a missing referenced asset means the layout
     * changed and the measurement would silently undercount. --allow-missing
     * downgrades this to a warning for outputs that intentionally reference
     * resources served from elsewhere.
     */
    console.error(`Referenced resource not found in ${outDir}: ${url}`)
    if (!allowMissing) process.exit(1)
    continue
  }
  if (excludeRes.some(re => re.test(resolved.rel))) continue
  const {size} = fs.statSync(resolved.abs)
  total += size
  count++
  console.error(`${String(size).padStart(12)}  ${resolved.rel}`)
}

if (count === 1) {
  // Fail loudly: index.html referencing no assets means the build output
  // layout changed and a near-0 measurement would corrupt the CI size diff.
  console.error(`No resources measured from ${indexPath}; check the build.`)
  if (!allowMissing) process.exit(1)
}

console.error(
  `Measured index.html + ${count - 1} referenced assets in ${outDir}: ${(total / 1024).toFixed(2)} KB`,
)
console.log(total)
