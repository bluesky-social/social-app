const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const templateFile = path.join(
  projectRoot,
  'bskyweb',
  'templates',
  'scripts.html',
)

// Support both webpack (asset-manifest.json) and rsbuild (manifest.json) formats
function getEntrypoints() {
  const webpackManifestPath = path.join(
    projectRoot,
    'web-build/asset-manifest.json',
  )
  const rsbuildManifestPath = path.join(projectRoot, 'web-build/manifest.json')

  // Try webpack format first
  if (fs.existsSync(webpackManifestPath)) {
    const manifest = require(webpackManifestPath)
    if (manifest.entrypoints) {
      console.log('Using webpack manifest format')
      return manifest.entrypoints
    }
  }

  // Try rsbuild format
  if (fs.existsSync(rsbuildManifestPath)) {
    const manifest = require(rsbuildManifestPath)
    if (manifest.entries?.index?.initial) {
      console.log('Using rsbuild manifest format')
      const initial = manifest.entries.index.initial
      // Combine JS and CSS entrypoints, CSS first for proper loading order
      return [...(initial.css || []), ...(initial.js || [])]
    }
  }

  throw new Error('No valid manifest found in web-build/')
}

const entrypoints = getEntrypoints()
console.log(`Found ${entrypoints.length} entrypoints`)
console.log(`Writing ${templateFile}`)

const outputFile = entrypoints
  .map(name => {
    const file = path.basename(name)
    const ext = path.extname(file)

    if (ext === '.js') {
      return `<script defer="defer" src="{{ staticCDNHost }}/static/js/${file}"></script>`
    }
    if (ext === '.css') {
      return `<link rel="stylesheet" href="{{ staticCDNHost }}/static/css/${file}">`
    }

    return ''
  })
  .join('\n')
fs.writeFileSync(templateFile, outputFile)

function copyFilesRecursive(sourceDir, targetDir) {
  const sourcePath = path.join(projectRoot, sourceDir)
  const targetPath = path.join(projectRoot, targetDir)

  // Ensure target directory exists
  fs.mkdirSync(targetPath, {recursive: true})

  const entries = fs.readdirSync(sourcePath, {withFileTypes: true})
  for (const entry of entries) {
    const srcPath = path.join(sourcePath, entry.name)
    const destPath = path.join(targetPath, entry.name)

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyFilesRecursive(
        path.join(sourceDir, entry.name),
        path.join(targetDir, entry.name),
      )
    } else {
      fs.copyFileSync(srcPath, destPath)
      console.log(`Copied ${srcPath} to ${destPath}`)
    }
  }
}

copyFilesRecursive('web-build/static/js', 'bskyweb/static/js')
copyFilesRecursive('web-build/static/css', 'bskyweb/static/css')
copyFilesRecursive('web-build/static/media', 'bskyweb/static/media')
