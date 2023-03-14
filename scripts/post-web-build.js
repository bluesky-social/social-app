const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const webBuildJs = path.join(projectRoot, 'web-build', 'static', 'js')
const templateFile = path.join(
  projectRoot,
  'bskyweb',
  'templates',
  'scripts.html',
)

const jsFiles = fs.readdirSync(webBuildJs).filter(name => name.endsWith('.js'))
jsFiles.sort((a, b) => {
  // make sure main is written last
  if (a.startsWith('main')) return 1
  if (b.startsWith('main')) return -1
  return a.localeCompare(b)
})

console.log(`Found ${jsFiles.length} js files in web-build`)
console.log(`Writing ${templateFile}`)

const outputFile = jsFiles
  .map(name => `<script defer="defer" src="/static/js/${name}"></script>`)
  .join('\n')
fs.writeFileSync(templateFile, outputFile)
