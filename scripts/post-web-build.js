const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const templateFile = path.join(
  projectRoot,
  'bskyweb',
  'templates',
  'scripts.html',
)

const {entrypoints} = require(path.join(
  projectRoot,
  'web-build/asset-manifest.json',
))

console.log(`Found ${entrypoints.length} entrypoints`)
console.log(`Writing ${templateFile}`)

const outputFile = entrypoints
  .map(name => {
    const file = path.basename(name)
    return `<script defer="defer" src="/static/js/${file}"></script>`
  })
  .join('\n')
fs.writeFileSync(templateFile, outputFile)
