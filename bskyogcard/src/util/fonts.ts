import {readdirSync, readFileSync} from 'node:fs'
import * as path from 'node:path'

const __DIRNAME = path.join(process.cwd(), 'src')

export function getFontFiles() {
  const fontDirectory = path.join(__DIRNAME, 'assets', 'fonts')
  return readdirSync(fontDirectory)
    .filter(file => file.endsWith('.ttf'))
    .map(file => path.join(fontDirectory, file))
}

export function readFonts(fontFiles: string[]) {
  return fontFiles.map(file => {
    const basename = path.basename(file, path.extname(file))
    const italic = basename.includes('Italic')
    const [weight, name] = basename.split('-')
    return {
      name,
      data: readFileSync(file),
      weight: parseInt(weight),
      style: italic ? 'italic' : 'normal',
    }
  })
}
