const path = require('node:path')
const fs = require('node:fs')

const projectRoot = path.join(__dirname, '..')

// copy embed assets to web-build

const embedAssetSource = path.join(
  projectRoot,
  'bskyembed',
  'dist',
  'static',
  'embed',
)

const embedAssetDest = path.join(projectRoot, 'web-build', 'static', 'embed')

fs.cpSync(embedAssetSource, embedAssetDest, {recursive: true})

// copy entrypoint(s) to web-build

// additional entrypoints will need more work, but this'll do for now
const embedHtmlSource = path.join(
  projectRoot,
  'bskyembed',
  'dist',
  'index.html',
)

const embedHtmlDest = path.join(
  projectRoot,
  'bskyweb',
  'templates',
  'post-embed.html',
)

fs.copyFileSync(embedHtmlSource, embedHtmlDest)

console.log(`Copied embed assets to web-build`)
