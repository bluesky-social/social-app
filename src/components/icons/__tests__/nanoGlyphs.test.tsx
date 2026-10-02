// Jest runs in Node; the test lists the icon modules from disk.
// oxlint-disable-next-line import/no-nodejs-modules
import fs from 'node:fs'
// oxlint-disable-next-line import/no-nodejs-modules
import path from 'node:path'

import {render} from '@testing-library/react-native'

import {nanoGlyphs} from '#/components/icons/nanoGlyphs'

jest.mock('#/alf', () => ({
  tokens: {gradients: {}},
  useTheme: () => ({palette: {primary_500: '#000'}}),
}))

const iconsRoot = path.join(__dirname, '..')

/*
 * Every icon module under src/components/icons. Codegen modules re-export
 * canonical icons under deprecated names, so the same component can appear
 * more than once.
 */
function iconModules() {
  return fs
    .readdirSync(iconsRoot, {recursive: true, encoding: 'utf8'})
    .filter(
      file =>
        file.endsWith('.tsx') &&
        !file.startsWith('__tests__') &&
        !/^(TEMPLATE|nano|common)\.tsx$/.test(file),
    )
    .map(file => require(path.join(iconsRoot, file)) as Record<string, unknown>)
}

type Icon = React.ComponentType & {svgPaths?: string[]; svgViewBox?: string}

/** Icons with identical geometry share one glyph, listed under one name. */
function geometry(icon: Icon) {
  return `${icon.svgPaths?.join('|')}|${icon.svgViewBox}`
}

describe('nanoGlyphs', () => {
  it('matches the icons that TEMPLATE renders as glyphs', () => {
    const icons = new Map<Icon, string>()
    for (const exports of iconModules()) {
      for (const [name, value] of Object.entries(exports)) {
        const icon = value as Icon
        if (icon?.svgPaths && !icons.has(icon)) icons.set(icon, name)
      }
    }
    const glyphNames = new Set(
      Object.values(nanoGlyphs).map(([, name]) => name),
    )
    const glyphGeometries = new Set(
      [...icons]
        .filter(([, name]) => glyphNames.has(name))
        .map(([icon]) => geometry(icon)),
    )

    const rendersGlyph = (Icon: Icon) =>
      JSON.stringify(render(<Icon />).toJSON()).includes('"fontFamily":"icons-')
    for (const [icon, name] of icons) {
      expect({name, glyph: rendersGlyph(icon)}).toEqual({
        name,
        glyph: glyphGeometries.has(geometry(icon)),
      })
    }
    expect(
      [...icons.values()].filter(name => glyphNames.has(name)).sort(),
    ).toEqual([...glyphNames].sort())
  })
})
