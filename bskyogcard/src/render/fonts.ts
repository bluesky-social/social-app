import {createHash} from 'node:crypto'
import {readdirSync, readFileSync} from 'node:fs'

import {type FontWeight} from 'satori'

export type RenderFont = {name: string; data: Buffer; weight?: FontWeight}
export type FontMetadata = {name: string; weight?: FontWeight; sha256: string}

/** Each renderer owns its font buffers; HTTP processes retain only metadata. */
export function loadFonts(): RenderFont[] {
  const directory = new URL('../assets/fonts/', import.meta.url)
  return readdirSync(directory)
    .filter(file => file.endsWith('.ttf'))
    .map(file => ({
      name: file.startsWith('Inter-') ? 'Inter' : file.slice(0, -4),
      data: readFileSync(new URL(file, directory)),
      weight:
        file === 'Inter-Regular.ttf'
          ? 400
          : file === 'Inter-SemiBold.ttf'
            ? 600
            : 700,
    }))
}

export function loadFontMetadata(): FontMetadata[] {
  return loadFonts().map(({name, weight, data}) => ({
    name,
    weight,
    sha256: createHash('sha256').update(data).digest('hex'),
  }))
}
