import {writeFile} from 'node:fs/promises'
import * as path from 'node:path'
import {fileURLToPath} from 'node:url'

const __DIRNAME = path.dirname(fileURLToPath(import.meta.url))

const FONTS = [
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@5.0/japanese-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tc@5.0/chinese-traditional-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@5.0/chinese-simplified-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-hk@5.0/chinese-hongkong-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@5.0/korean-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@5.0/thai-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-arabic@5.0/arabic-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-hebrew@5.0/hebrew-700-normal.ttf',
]

async function main() {
  await Promise.all(
    FONTS.map(async urlStr => {
      const url = new URL(urlStr)
      const res = await fetch(url)
      const font = await res.arrayBuffer()
      const filename = url.pathname
        .split('/')
        .slice(-2)
        .join('/')
        .replace(/@[\d.]+\//, '-')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: fetching failed for ${filename}`)
      }
      await writeFile(
        path.join(__DIRNAME, '..', 'src', 'assets', 'fonts', filename),
        Buffer.from(font),
      )
    }),
  )
}

main()
