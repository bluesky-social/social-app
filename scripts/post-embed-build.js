const path = require('node:path')
const fs = require('node:fs')

const projectRoot = path.join(__dirname, '..')
const embedDist = path.join(projectRoot, 'services', 'embed', 'dist')
const webDir = path.join(projectRoot, 'services', 'web')

// copy embed assets to embedr

fs.cpSync(path.join(embedDist, 'static'), path.join(webDir, 'embedr-static'), {
  recursive: true,
})

fs.cpSync(
  path.join(embedDist, 'embed.js'),
  path.join(webDir, 'embedr-static', 'embed.js'),
)

// copy entrypoint(s) to embedr

// additional entrypoints will need more work, but this'll do for now
fs.copyFileSync(
  path.join(embedDist, 'index.html'),
  path.join(webDir, 'embedr-templates', 'home.html'),
)

fs.copyFileSync(
  path.join(embedDist, 'post.html'),
  path.join(webDir, 'embedr-templates', 'postEmbed.html'),
)

console.log(`Copied embed assets to embedr`)
