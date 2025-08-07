const path = require('node:path')
const fs = require('node:fs')

const projectRoot = path.join(__dirname, '..')

// copy embed assets to embedr

const embedAssetSource = path.join(projectRoot, 'gndrembed', 'dist', 'static')

const embedAssetDest = path.join(projectRoot, 'gndrweb', 'embedr-static')

fs.cpSync(embedAssetSource, embedAssetDest, {recursive: true})

const embedEmbedJSSource = path.join(
  projectRoot,
  'gndrembed',
  'dist',
  'embed.js',
)

const embedEmbedJSDest = path.join(
  projectRoot,
  'gndrweb',
  'embedr-static',
  'embed.js',
)

fs.cpSync(embedEmbedJSSource, embedEmbedJSDest)

// copy entrypoint(s) to embedr

// additional entrypoints will need more work, but this'll do for now
const embedHomeHtmlSource = path.join(
  projectRoot,
  'gndrembed',
  'dist',
  'index.html',
)

const embedHomeHtmlDest = path.join(
  projectRoot,
  'gndrweb',
  'embedr-templates',
  'home.html',
)

fs.copyFileSync(embedHomeHtmlSource, embedHomeHtmlDest)

const embedPostHtmlSource = path.join(
  projectRoot,
  'gndrembed',
  'dist',
  'post.html',
)

const embedPostHtmlDest = path.join(
  projectRoot,
  'gndrweb',
  'embedr-templates',
  'postEmbed.html',
)

fs.copyFileSync(embedPostHtmlSource, embedPostHtmlDest)

console.log(`Copied embed assets to embedr`)
