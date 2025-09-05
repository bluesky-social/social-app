import {writeFile} from 'node:fs/promises'
import * as path from 'node:path'
import {fileURLToPath} from 'node:url'

import {
  ADDITIONAL_FONTS,
  ADDITIONAL_FONTS_POSTSCRIPT_NAMES,
} from '../src/util/fonts.js'

const __DIRNAME = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__DIRNAME, '..', 'src', 'assets', 'fonts')

async function main() {
  await Promise.all(
    ADDITIONAL_FONTS.map(async urlStr => {
      // get last part of the URL
      const raw = urlStr.split('/').slice(-1).join('')
      // style and weight are known parts of the path, rest is the font family
      const [styleWithExtension, weight, ...fontFamilyParts] = raw
        .split('-')
        .reverse()
      const style = styleWithExtension.split('.')[0]
      // re-reverse the font family parts to get the original order
      const rawFontFamily = fontFamilyParts.reverse().join('-')
      // get the postscript name from the map
      const postScriptName = ADDITIONAL_FONTS_POSTSCRIPT_NAMES[rawFontFamily]
      // our filename format: `weight-postScriptName-style.ttf`
      const filename = `${weight}-${postScriptName}-${style}.ttf`
      // fetch the file
      const res = await fetch(urlStr)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: fetching failed for ${urlStr}`)
      }

      console.log(`Writing font ${filename}...`)

      await writeFile(
        path.join(outDir, filename),
        Buffer.from(await res.arrayBuffer()),
      )
    }),
  )
}

main()
