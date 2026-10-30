import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  applyIconSet,
  assignFamilies,
  applyNanoFonts,
  buildIconSet,
  discoverIconSources,
  glyphMismatch,
  normalizeExportName,
  readIconSource,
  validatePathData,
} from './lib.mts'

async function fixture(t, lane, name, svg) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icon-codegen-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  await fs.mkdir(path.join(root, lane), {recursive: true})
  await fs.writeFile(path.join(root, lane, name), svg)
  return {relative: path.join(lane, name), root}
}

test('validates SVG path grammar', () => {
  validatePathData('M0 0h2v2H0Z')
  validatePathData('M0,0 2,2')
  assert.throws(() => validatePathData('M0 0 L nope'), /L has no arguments/)
  assert.throws(() => validatePathData('M0'), /too few arguments/)
  assert.throws(() => validatePathData('M0 0A1 1 0 2 0 3 4'), /large-arc-flag/)
  assert.throws(() => validatePathData('M0,,0'), /misplaced comma/)
  assert.throws(() => validatePathData('M,0 0'), /misplaced comma/)
  assert.throws(() => validatePathData('M0 0,'), /misplaced comma/)
})

test('normalizes accidental legacy export spelling', () => {
  assert.equal(
    normalizeExportName('Envelope_Open_Stoke2_Corner0_Rounded'),
    'EnvelopeOpen_Stroke2_Corner0_Rounded',
  )
})

test('groups families deterministically', () => {
  const icons = [
    {exportName: 'CircleCheck_Stroke2_Corner0_Rounded', namespace: ''},
    {exportName: 'CircleInfo_Stroke2_Corner0_Rounded', namespace: ''},
    {exportName: 'MagnifyingGlass_Stroke2_Corner0_Rounded', namespace: ''},
    {exportName: 'MagnifyingGlassX_Stroke2_Corner0_Rounded', namespace: ''},
  ]
  assignFamilies(icons)
  assert.deepEqual(icons.map(icon => icon.family), [
    'Circle',
    'Circle',
    'MagnifyingGlass',
    'MagnifyingGlass',
  ])
})

test('draws icons as font glyphs only where they match the SVG icon', async () => {
  const viewBox = '0 0 24 24'
  const fill = d => ({description: {path: d, fillRule: 'nonzero', strokeWidth: 0}, viewBox})
  const square = 'M0 0h24v24H0Z'
  // An inner contour wound the same way as the outer one is a hole only under evenodd.
  const nested = 'M0 0h24v24H0ZM6 6h12v12H6Z'
  // Same-direction contours overlapping in a 0.1 x 0.1 sliver, as left by outlined strokes.
  const sliver = 'M2 2h10.01v10H2ZM12 2h10v10H12Z'
  assert.equal(await glyphMismatch(fill(square), 24, 24), undefined)
  assert.equal(await glyphMismatch(fill(sliver), 24, 24), undefined)
  assert.equal(await glyphMismatch(fill(nested), 50, 45), 'non-square viewBox')
  assert.match(await glyphMismatch(fill(nested), 24, 24), /nonzero fill rule/)
  assert.equal(
    await glyphMismatch({description: {path: nested, fillRule: 'evenodd', strokeWidth: 0}, viewBox}, 24, 24),
    undefined,
  )
  assert.equal(
    await glyphMismatch({description: {path: nested, strokeWidth: 2}, viewBox}, 24, 24),
    undefined,
  )
})

test('passes the glyph name only to icons drawn as glyphs', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icon-codegen-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  const sourceRoot = path.join(root, 'assets/icons')
  const scanRoot = path.join(root, 'src')
  const outputRoot = path.join(scanRoot, 'components/icons')
  await fs.mkdir(path.join(sourceRoot, 'ui'), {recursive: true})
  await fs.mkdir(outputRoot, {recursive: true})
  await fs.writeFile(
    path.join(sourceRoot, 'ui/Square_Stroke2_Corner0_Rounded.svg'),
    '<svg viewBox="0 0 24 24"><path d="M0 0h2v2Z"/></svg>',
  )
  await fs.writeFile(
    path.join(sourceRoot, 'ui/Wide_Stroke2_Corner0_Rounded.svg'),
    '<svg viewBox="0 0 30 24"><path d="M0 0h2v2Z"/></svg>',
  )

  const {tsOutputs} = await buildIconSet({outputRoot, scanRoot, sourceRoot})
  assert.match(tsOutputs.get('Square.tsx'), /glyph: 'Square_Stroke2_Corner0_Rounded'/)
  assert.doesNotMatch(tsOutputs.get('Wide.tsx'), /glyph:/)
})

test('accepts fill and supported stroke icons', async t => {
  const fill = await fixture(
    t,
    'ui',
    'Fill_Filled_Corner0_Rounded.svg',
    '<svg viewBox="0 0 24 24"><path d="M0 0h2v2Z"/></svg>',
  )
  assert.equal((await readIconSource(fill.root, fill.relative)).description.strokeWidth, 0)

  const stroke = await fixture(
    t,
    'ui',
    'StrokeIcon_Stroke2_Corner0_Rounded.svg',
    '<svg fill="none" viewBox="0 0 24 24"><path d="M0 0h2" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>',
  )
  assert.equal((await readIconSource(stroke.root, stroke.relative)).description.strokeWidth, 1.5)

  const nonstandard = await fixture(
    t,
    'ui',
    'Nonstandard_Stroke2_Corner0_Rounded.svg',
    '<svg viewBox="0 0 20 18"><path d="M0 0h2"/></svg>',
  )
  assert.deepEqual((await readIconSource(nonstandard.root, nonstandard.relative)).warnings, [
    `${nonstandard.relative}: non-standard viewBox 0 0 20 18; expected 24x24 or 64x64`,
  ])
})

test('rejects malformed and suspicious SVG input', async t => {
  const malformed = await fixture(t, 'ui', 'Bad.svg', '<svg viewBox="0 0 24 24"><path></svg>')
  await assert.rejects(readIconSource(malformed.root, malformed.relative), /malformed SVG/)

  const noViewBox = await fixture(t, 'ui', 'NoViewBox.svg', '<svg><path d="M0 0h2"/></svg>')
  await assert.rejects(readIconSource(noViewBox.root, noViewBox.relative), /missing viewBox/)

  const invalidPath = await fixture(
    t,
    'ui',
    'InvalidPath.svg',
    '<svg viewBox="0 0 24 24"><path d="M0 0 L nope"/></svg>',
  )
  await assert.rejects(readIconSource(invalidPath.root, invalidPath.relative), /L has no arguments/)

  const external = await fixture(
    t,
    'ui',
    'External.svg',
    '<svg viewBox="0 0 24 24"><image href="https://example.com/a.png"/></svg>',
  )
  await assert.rejects(readIconSource(external.root, external.relative), /unsupported <image>/)

  const script = await fixture(
    t,
    'custom',
    'Raw.svg',
    '<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M0 0h2"/></svg>',
  )
  await assert.rejects(readIconSource(script.root, script.relative), /unsupported <script>/)

  const nestedSvg = await fixture(
    t,
    'ui',
    'Nested.svg',
    '<g><svg viewBox="0 0 24 24"><path d="M0 0h2"/></svg></g>',
  )
  await assert.rejects(readIconSource(nestedSvg.root, nestedSvg.relative), /root <svg>/)

  const droppedPresentation = await fixture(
    t,
    'ui',
    'Opacity_Filled_Corner0_Rounded.svg',
    '<svg viewBox="0 0 24 24"><path opacity=".5" d="M0 0h2"/></svg>',
  )
  await assert.rejects(readIconSource(droppedPresentation.root, droppedPresentation.relative), /unsupported opacity attribute/)

  const unsupportedFillRule = await fixture(
    t,
    'ui',
    'FillRule_Filled_Corner0_Rounded.svg',
    '<svg viewBox="0 0 24 24"><path fill-rule="nonzero" d="M0 0h2"/></svg>',
  )
  await assert.rejects(readIconSource(unsupportedFillRule.root, unsupportedFillRule.relative), /unsupported fill-rule/)

  const externalCss = await fixture(
    t,
    'custom',
    'ExternalCss.svg',
    '<svg viewBox="0 0 24 24"><style>.x{fill:URL(data:image/svg+xml,bad)}</style><path d="M0 0h2"/></svg>',
  )
  await assert.rejects(readIconSource(externalCss.root, externalCss.relative), /external URL/)
})

test('keeps multi-path artwork out of generated icon lanes', async t => {
  const svg = '<svg viewBox="0 0 24 24"><path fill="#000" d="M0 0h2v2Z"/><path fill="#111" d="M4 4h2v2Z"/></svg>'
  const ui = await fixture(t, 'ui', 'Multiple_Filled_Corner0_Rounded.svg', svg)
  await assert.rejects(readIconSource(ui.root, ui.relative), /must optimize to exactly one path/)

  const custom = await fixture(t, 'custom', 'Multiple.svg', svg)
  assert.equal((await readIconSource(custom.root, custom.relative)).codegen, false)

  const formerLane = await fixture(t, 'multipath', 'Multiple.svg', svg)
  await assert.rejects(readIconSource(formerLane.root, formerLane.relative), /unclassified source directory multipath/)
})

test('requires UI filenames to follow the icon style scheme', async t => {
  const svg = '<svg viewBox="0 0 24 24"><path d="M0 0h2v2Z"/></svg>'
  const bare = await fixture(t, 'ui', 'Reply.svg', svg)
  await assert.rejects(readIconSource(bare.root, bare.relative), /UI icon names must/)

  const incomplete = await fixture(t, 'ui', 'Bot_Filled.svg', svg)
  await assert.rejects(readIconSource(incomplete.root, incomplete.relative), /UI icon names must/)

  const dollarInitial = await fixture(t, 'ui', '$Reply_Stroke2_Corner0_Rounded.svg', svg)
  await assert.rejects(readIconSource(dollarInitial.root, dollarInitial.relative), /uppercase letter/)

  const underscoreInitial = await fixture(t, 'ui', '_Filled_Corner0_Rounded.svg', svg)
  await assert.rejects(readIconSource(underscoreInitial.root, underscoreInitial.relative), /uppercase letter/)

  const falseLarge = await fixture(t, 'ui', 'Small_Stroke2_Corner0_Rounded_Large.svg', svg)
  await assert.rejects(readIconSource(falseLarge.root, falseLarge.relative), /viewBox is 64x64/)

  const missingLarge = await fixture(
    t,
    'ui',
    'Big_Stroke2_Corner0_Rounded.svg',
    '<svg viewBox="0 0 64 64"><path d="M0 0h2v2Z"/></svg>',
  )
  await assert.rejects(readIconSource(missingLarge.root, missingLarge.relative), /viewBox is 64x64/)
})

test('preserves supported brand shapes and paint roles', async t => {
  const brand = await fixture(
    t,
    'brands',
    'Badge.svg',
    '<svg fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path fill="#fff" d="M4 4h2v2Z"/></svg>',
  )
  const icon = await readIconSource(brand.root, brand.relative)
  assert.deepEqual(icon.elements.map(element => [element.type, element.fill]), [
    ['circle', 'currentColor'],
    ['path', '#fff'],
  ])
})

test('detects export collisions', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icon-codegen-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  const sourceRoot = path.join(root, 'assets/icons')
  const scanRoot = path.join(root, 'src')
  const outputRoot = path.join(scanRoot, 'components/icons')
  await fs.mkdir(path.join(sourceRoot, 'ui'), {recursive: true})
  await fs.mkdir(path.join(sourceRoot, 'brands'), {recursive: true})
  await fs.mkdir(scanRoot, {recursive: true})
  const svg = '<svg viewBox="0 0 24 24"><path d="M0 0h2v2Z"/></svg>'
  await fs.writeFile(path.join(sourceRoot, 'ui/Same_Stroke2_Corner0_Rounded.svg'), svg)
  await fs.writeFile(path.join(sourceRoot, 'brands/Same_Stroke2_Corner0_Rounded.svg'), svg)
  await assert.rejects(
    buildIconSet({outputRoot, scanRoot, sourceRoot}),
    /duplicate export Same_Stroke2_Corner0_Rounded/,
  )
})

test('rejects unsafe legacy import module paths', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icon-codegen-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  const sourceRoot = path.join(root, 'assets/icons')
  const scanRoot = path.join(root, 'src')
  const outputRoot = path.join(scanRoot, 'components/icons')
  await fs.mkdir(path.join(sourceRoot, 'ui'), {recursive: true})
  await fs.mkdir(outputRoot, {recursive: true})
  await fs.writeFile(
    path.join(sourceRoot, 'ui/Safe_Stroke2_Corner0_Rounded.svg'),
    '<svg viewBox="0 0 24 24"><path d="M0 0h2v2Z"/></svg>',
  )
  await fs.writeFile(
    path.join(scanRoot, 'consumer.ts'),
    "import {Safe_Stroke2_Corner0_Rounded} from '#/components/icons/../../../outside'\n",
  )

  await assert.rejects(
    buildIconSet({outputRoot, scanRoot, sourceRoot}),
    /invalid icon module path/,
  )
})

test('generates deprecated compatibility aliases and detects stale output', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icon-codegen-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  const sourceRoot = path.join(root, 'assets/icons')
  const scanRoot = path.join(root, 'src')
  const outputRoot = path.join(scanRoot, 'components/icons')
  await fs.mkdir(path.join(sourceRoot, 'ui'), {recursive: true})
  await fs.mkdir(outputRoot, {recursive: true})
  const svg = name => `<svg viewBox="0 0 24 24"><path d="M0 0h${name.length}v2Z"/></svg>`
  await fs.writeFile(
    path.join(sourceRoot, 'ui/CircleCheck_Stroke2_Corner0_Rounded.svg'),
    svg('check'),
  )
  await fs.writeFile(
    path.join(sourceRoot, 'ui/CirclePlus_Stroke2_Corner0_Rounded.svg'),
    svg('plus'),
  )
  await fs.writeFile(
    path.join(sourceRoot, 'ui/EnvelopeOpen_Stroke2_Corner0_Rounded.svg'),
    svg('envelope'),
  )
  await fs.writeFile(
    path.join(scanRoot, 'consumer.ts'),
    "import {unrelated} from '#/somewhere-else'\nimport {CircleCheck_Stroke2_Corner0_Rounded} from '#/components/icons/CircleCheck'\nimport {Envelope_Open_Stoke2_Corner0_Rounded} from '#/components/icons/EnvelopeOpen'\n",
  )

  const result = await buildIconSet({outputRoot, scanRoot, sourceRoot})
  assert.match(result.tsOutputs.get('CircleCheck.tsx'), /@deprecated Import CircleCheck_Stroke2_Corner0_Rounded from `#\/components\/icons\/Circle`/)
  assert.match(result.tsOutputs.get('EnvelopeOpen.tsx'), /export const Envelope_Open_Stoke2_Corner0_Rounded =/)
  assert.doesNotMatch(
    result.tsOutputs.get('EnvelopeOpen.tsx'),
    /from ['"]\.\/EnvelopeOpen['"]/,
  )
  const written = await applyIconSet({check: false, outputRoot, result, sourceRoot})
  assert.ok(written.includes(path.relative(process.cwd(), path.join(outputRoot, 'Circle.tsx'))))
  assert.ok(written.includes(path.relative(process.cwd(), path.join(outputRoot, 'CircleCheck.tsx'))))
  assert.deepEqual(await applyIconSet({check: true, outputRoot, result, sourceRoot}), [])
  await fs.appendFile(path.join(outputRoot, 'Circle.tsx'), '// stale\n')
  assert.deepEqual(await applyIconSet({check: true, outputRoot, result, sourceRoot}), [
    path.relative(process.cwd(), path.join(outputRoot, 'Circle.tsx')),
  ])
})

test('refuses to overwrite handwritten canonical modules', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icon-codegen-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  const sourceRoot = path.join(root, 'assets/icons')
  const scanRoot = path.join(root, 'src')
  const outputRoot = path.join(scanRoot, 'components/icons')
  await fs.mkdir(path.join(sourceRoot, 'ui'), {recursive: true})
  await fs.mkdir(outputRoot, {recursive: true})
  await fs.writeFile(
    path.join(sourceRoot, 'ui/Logo_Stroke2_Corner0_Rounded.svg'),
    '<svg viewBox="0 0 24 24"><path d="M0 0h2v2Z"/></svg>',
  )
  await fs.writeFile(
    path.join(outputRoot, 'Logo.tsx'),
    "import {createSinglePathSVG} from './TEMPLATE'\nexport const Logo = createSinglePathSVG({path: 'M0 0', viewBox: '0 0 24 24'})\nexport const Full = () => null\n",
  )

  await assert.rejects(
    buildIconSet({outputRoot, scanRoot, sourceRoot}),
    /generated output would overwrite a handwritten module/,
  )
})

const require = createRequire(import.meta.url)
const nanoDir = path.dirname(require.resolve('react-native-nano-icons/package.json'))
const {buildAllFonts} = require('react-native-nano-icons/cli')

const LANES = ['ui', 'brands', 'community']
const SQUARE = 'M4 4h16v16H4Z'
const TRIANGLE = 'M2 2h20L2 22Z'
const DIAMOND = 'M12 2l10 10-10 10L2 12Z'
const svgOf = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>\n`
const brandOf = r =>
  `<svg fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="${r}" fill="currentColor"/><path fill="#fff" d="M4 4h2v2Z"/></svg>\n`
const NORMAL = {
  'ui/Base_Filled_Corner0_Rounded.svg': svgOf(SQUARE),
  'brands/Badge.svg': brandOf(10),
  'community/Service.svg': svgOf(TRIANGLE),
}
const DOCBLOCK = lane =>
  `/** Temporary SVG-only icon. Move its source to assets/icons/${lane}/ before a native release. */`

async function tempRoot(t, prefix = 'icon-codegen-') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  return root
}

/** An isolated repository with sources under assets/icons and output under src/components/icons. */
async function iconProject(t, files) {
  const root = await tempRoot(t)
  const sourceRoot = path.join(root, 'assets/icons')
  const scanRoot = path.join(root, 'src')
  const outputRoot = path.join(scanRoot, 'components/icons')
  await fs.mkdir(outputRoot, {recursive: true})
  const project = {
    root,
    outputRoot,
    sourceRoot,
    build: () => buildIconSet({outputRoot, scanRoot, sourceRoot}),
    apply: (check, result) => applyIconSet({check, outputRoot, result, sourceRoot}),
    async write(relative, contents) {
      await fs.mkdir(path.dirname(path.join(sourceRoot, relative)), {recursive: true})
      await fs.writeFile(path.join(sourceRoot, relative), contents)
    },
    move: async (from, to) => {
      await fs.mkdir(path.dirname(path.join(sourceRoot, to)), {recursive: true})
      await fs.rename(path.join(sourceRoot, from), path.join(sourceRoot, to))
    },
    remove: relative => fs.rm(path.join(sourceRoot, relative)),
  }
  for (const [relative, contents] of Object.entries(files)) await project.write(relative, contents)
  return project
}

test('classifies temporary sources by their logical lane', async t => {
  const project = await iconProject(t, {
    'tmp/ui/Ota_Stroke2_Corner0_Rounded.svg': svgOf(SQUARE),
    'tmp/brands/OtaBadge.svg': brandOf(10),
    'tmp/community/OtaService.svg': svgOf(TRIANGLE),
  })
  const read = relative => readIconSource(project.sourceRoot, path.join(...relative.split('/')))
  assert.deepEqual(
    await Promise.all(
      ['ui/Ota_Stroke2_Corner0_Rounded', 'brands/OtaBadge', 'community/OtaService'].map(async name => {
        const icon = await read(`tmp/${name}.svg`)
        return [icon.relativePath, icon.lane, icon.namespace, icon.temporary, icon.glyph, icon.codegen]
      }),
    ),
    [
      [path.join('tmp', 'ui', 'Ota_Stroke2_Corner0_Rounded.svg'), 'ui', '', true, false, true],
      [path.join('tmp', 'brands', 'OtaBadge.svg'), 'brands', 'brands', true, false, true],
      [path.join('tmp', 'community', 'OtaService.svg'), 'community', 'community', true, false, true],
    ],
  )
  assert.deepEqual(await discoverIconSources(project.sourceRoot), [
    path.join('tmp', 'brands', 'OtaBadge.svg'),
    path.join('tmp', 'community', 'OtaService.svg'),
    path.join('tmp', 'ui', 'Ota_Stroke2_Corner0_Rounded.svg'),
  ])
})

test('rejects temporary sources outside tmp/<ui|brands|community>/<file>.svg', async t => {
  const svg = svgOf(SQUARE)
  const project = await iconProject(t, {
    'tmp/Loose.svg': svg,
    'tmp/custom/Raw.svg': svg,
    'tmp/flags/Flag.svg': svg,
    'tmp/other/Thing.svg': svg,
    'tmp/ui/deeper/Thing_Stroke2_Corner0_Rounded.svg': svg,
    'ui/deeper/Thing_Stroke2_Corner0_Rounded.svg': svg,
  })
  const read = (...segments) => readIconSource(project.sourceRoot, path.join(...segments))
  await assert.rejects(read('tmp', 'Loose.svg'), /temporary icons must be in tmp\/ui\//)
  await assert.rejects(read('tmp', 'custom', 'Raw.svg'), /unsupported temporary source directory tmp\/custom/)
  await assert.rejects(read('tmp', 'flags', 'Flag.svg'), /unsupported temporary source directory tmp\/flags/)
  await assert.rejects(read('tmp', 'other', 'Thing.svg'), /unsupported temporary source directory tmp\/other/)
  await assert.rejects(read('tmp', 'ui', 'deeper', 'Thing_Stroke2_Corner0_Rounded.svg'), /nested icon source directories/)
  await assert.rejects(read('ui', 'deeper', 'Thing_Stroke2_Corner0_Rounded.svg'), /nested icon source directories/)
  await assert.rejects(project.build(), /temporary icons must be in|unsupported temporary source directory/)

  const stray = await iconProject(t, {'elsewhere/Thing.svg': svg, 'tmp/ui/Ok_Stroke2_Corner0_Rounded.svg': svg})
  await assert.rejects(discoverIconSources(stray.sourceRoot), /unclassified SVG sources:\nelsewhere/)
})

test('temporary sources get the same validation as their lane', async t => {
  const project = await iconProject(t, {
    'tmp/ui/Bare.svg': svgOf(SQUARE),
    'tmp/ui/Big_Stroke2_Corner0_Rounded.svg': '<svg viewBox="0 0 64 64"><path d="M0 0h2v2Z"/></svg>',
    'tmp/ui/Broken_Stroke2_Corner0_Rounded.svg': '<svg viewBox="0 0 24 24"><path></svg>',
    'tmp/ui/Multi_Filled_Corner0_Rounded.svg':
      '<svg viewBox="0 0 24 24"><path fill="#000" d="M0 0h2v2Z"/><path fill="#111" d="M4 4h2v2Z"/></svg>',
    'tmp/community/Opacity.svg': '<svg viewBox="0 0 24 24"><path opacity=".5" d="M0 0h2"/></svg>',
    'tmp/brands/lowercase.svg': brandOf(10),
    'tmp/brands/Script.svg': '<svg viewBox="0 0 24 24"><script>alert(1)</script></svg>',
  })
  const read = name => readIconSource(project.sourceRoot, path.join(...name.split('/')))
  await assert.rejects(read('tmp/ui/Bare.svg'), /UI icon names must/)
  await assert.rejects(read('tmp/ui/Big_Stroke2_Corner0_Rounded.svg'), /viewBox is 64x64/)
  await assert.rejects(read('tmp/ui/Broken_Stroke2_Corner0_Rounded.svg'), /malformed SVG/)
  await assert.rejects(read('tmp/ui/Multi_Filled_Corner0_Rounded.svg'), /must optimize to exactly one path/)
  await assert.rejects(read('tmp/community/Opacity.svg'), /unsupported opacity attribute/)
  await assert.rejects(read('tmp/brands/lowercase.svg'), /uppercase letter/)
  await assert.rejects(read('tmp/brands/Script.svg'), /unsupported <script>/)
})

test('generates normal exports with per-export cleanup docblocks', async t => {
  const project = await iconProject(t, {
    ...NORMAL,
    'tmp/ui/BaseTwo_Filled_Corner0_Rounded.svg': svgOf(DIAMOND),
    'tmp/ui/Wide_Filled_Corner0_Rounded.svg': '<svg viewBox="0 0 30 24"><path d="M0 0h2v2Z"/></svg>',
    'tmp/brands/OtaBadge.svg': brandOf(8),
    'tmp/community/OtaService.svg': svgOf(DIAMOND),
  })
  const result = await project.build()
  assert.deepEqual(result.temporaryIcons, [
    path.join('tmp', 'brands', 'OtaBadge.svg'),
    path.join('tmp', 'community', 'OtaService.svg'),
    path.join('tmp', 'ui', 'BaseTwo_Filled_Corner0_Rounded.svg'),
    path.join('tmp', 'ui', 'Wide_Filled_Corner0_Rounded.svg'),
  ])
  assert.deepEqual([...result.tsOutputs.keys()].sort(), [
    'Base.tsx',
    'Wide.tsx',
    'brands/Badge.tsx',
    'brands/OtaBadge.tsx',
    'community/OtaService.tsx',
    'community/Service.tsx',
  ])

  // A normal icon and a temporary one in the same module: only the latter is marked and glyphless.
  const base = result.tsOutputs.get('Base.tsx')
  assert.match(base, /\nexport const Base_Filled_Corner0_Rounded = createSinglePathSVG\(\{[^}]*glyph: 'Base_Filled_Corner0_Rounded'/)
  assert.ok(base.includes(`${DOCBLOCK('ui')}\nexport const BaseTwo_Filled_Corner0_Rounded = createSinglePathSVG({`))
  assert.equal(base.split('Temporary SVG-only icon').length - 1, 1)
  assert.doesNotMatch(base.slice(base.indexOf('BaseTwo')), /glyph:/)
  assert.ok(base.indexOf('Base_Filled_Corner0_Rounded =') < base.indexOf('BaseTwo_Filled_Corner0_Rounded ='))
  assert.doesNotMatch(base.slice(0, base.indexOf(DOCBLOCK('ui'))), /Temporary SVG-only/)

  // Flexible (brands) and community exports, through createSVG and createSinglePathSVG.
  const brand = result.tsOutputs.get('brands/OtaBadge.tsx')
  assert.match(brand, /createSVG/)
  assert.ok(brand.includes(`${DOCBLOCK('brands')}\nexport const OtaBadge = createSVG({`))
  assert.doesNotMatch(brand, /glyph:/)
  const community = result.tsOutputs.get('community/OtaService.tsx')
  assert.ok(community.includes(`${DOCBLOCK('community')}\nexport const OtaService = createSinglePathSVG({`))
  assert.doesNotMatch(community, /glyph:/)

  // Ordinary modules are untouched.
  assert.doesNotMatch(result.tsOutputs.get('brands/Badge.tsx'), /Temporary/)
  assert.match(result.tsOutputs.get('brands/Badge.tsx'), /glyph: 'Badge'/)
  assert.doesNotMatch(result.tsOutputs.get('community/Service.tsx'), /Temporary/)
  assert.match(result.tsOutputs.get('community/Service.tsx'), /glyph: 'Service'/)
  assert.doesNotMatch(result.tsOutputs.get('Wide.tsx'), /glyph:/)
})

test('ordinary sources produce no temporary output', async t => {
  const project = await iconProject(t, NORMAL)
  const result = await project.build()
  assert.deepEqual(result.temporaryIcons, [])
  for (const output of result.tsOutputs.values()) assert.doesNotMatch(output, /Temporary/)
})

test('rejects duplicates between normal and temporary sources', async t => {
  const project = await iconProject(t, {
    'ui/Same_Stroke2_Corner0_Rounded.svg': svgOf(SQUARE),
    'tmp/ui/Same_Stroke2_Corner0_Rounded.svg': svgOf(SQUARE),
  })
  await assert.rejects(project.build(), /duplicate export Same_Stroke2_Corner0_Rounded/)

  const crossLane = await iconProject(t, {
    'brands/Same.svg': brandOf(10),
    'tmp/community/Same.svg': svgOf(SQUARE),
  })
  await assert.rejects(crossLane.build(), /duplicate export Same/)

  const normalized = await iconProject(t, {
    'ui/Envelope_Stroke2_Corner0_Rounded.svg': svgOf(SQUARE),
    'tmp/ui/Envelope_Stoke2_Corner0_Rounded.svg': svgOf(SQUARE),
  })
  await assert.rejects(normalized.build(), /non-canonical export name/)
})

test('temporary icons are generated idempotently and are not exempt from freshness checks', async t => {
  const project = await iconProject(t, {
    ...NORMAL,
    // Unoptimized on purpose: the optimized SVG is written back to the temporary path.
    'tmp/ui/Ota_Filled_Corner0_Rounded.svg': '<svg viewBox="0 0 24 24"  ><!-- note --><path d="M 4 4 h 16 v 16 H 4 Z"/></svg>',
  })
  const tmpSvg = path.join('tmp', 'ui', 'Ota_Filled_Corner0_Rounded.svg')
  const first = await project.build()
  const written = await project.apply(false, first)
  assert.ok(written.some(file => file.endsWith(tmpSvg)), 'writes the optimized temporary SVG')

  const second = await project.build()
  assert.deepEqual(second.tsOutputs, first.tsOutputs)
  assert.deepEqual(second.svgOutputs, first.svgOutputs)
  assert.deepEqual(await project.apply(true, second), [])
  assert.doesNotMatch(await fs.readFile(path.join(project.sourceRoot, tmpSvg), 'utf8'), /note|\s{2}/)

  // Stale optimized SVG.
  await project.write(tmpSvg, '<svg viewBox="0 0 24 24"><path d="M 4 4 h 16 v 16 H 4 Z"/></svg>')
  assert.deepEqual(await project.apply(true, await project.build()), [
    path.relative(process.cwd(), path.join(project.sourceRoot, tmpSvg)),
  ])
  await project.apply(false, await project.build())
  assert.deepEqual(await project.apply(true, await project.build()), [])

  // Stale generated TypeScript.
  const ts = path.join(project.outputRoot, 'Base.tsx')
  await fs.appendFile(ts, '// stale\n')
  assert.deepEqual(await project.apply(true, await project.build()), [path.relative(process.cwd(), ts)])
  await project.apply(false, await project.build())

  // A removed temporary source leaves no stale module behind.
  await project.remove(tmpSvg)
  const removed = await project.build()
  assert.ok(!removed.tsOutputs.get('Base.tsx').includes('Ota_Filled'))
  assert.deepEqual(removed.temporaryIcons, [])
})

test('moving a temporary source into its lane keeps the export and import path', async t => {
  const project = await iconProject(t, {
    ...NORMAL,
    'tmp/ui/Ota_Filled_Corner0_Rounded.svg': svgOf(DIAMOND),
    'tmp/brands/OtaBadge.svg': brandOf(8),
    'tmp/community/OtaService.svg': svgOf(DIAMOND),
    'tmp/ui/OtaWide_Filled_Corner0_Rounded.svg': '<svg viewBox="0 0 30 24"><path d="M0 0h2v2Z"/></svg>',
  })
  const before = await project.build()
  for (const name of ['ui/Ota_Filled_Corner0_Rounded', 'brands/OtaBadge', 'community/OtaService', 'ui/OtaWide_Filled_Corner0_Rounded']) {
    await project.move(path.join('tmp', ...name.split('/')) + '.svg', path.join(...name.split('/')) + '.svg')
  }
  const after = await project.build()
  assert.deepEqual([...after.tsOutputs.keys()].sort(), [...before.tsOutputs.keys()].sort())
  assert.deepEqual(after.temporaryIcons, [])
  for (const output of after.tsOutputs.values()) assert.doesNotMatch(output, /Temporary/)
  assert.match(after.tsOutputs.get('Ota.tsx'), /export const Ota_Filled_Corner0_Rounded[^]*glyph: 'Ota_Filled_Corner0_Rounded'/)
  assert.match(after.tsOutputs.get('brands/OtaBadge.tsx'), /glyph: 'OtaBadge'/)
  assert.match(after.tsOutputs.get('community/OtaService.tsx'), /glyph: 'OtaService'/)
  // The existing glyph-equivalence fallback still applies after the move.
  const [, wide] = after.tsOutputs.get('Ota.tsx').split('export const OtaWide_Filled_Corner0_Rounded')
  assert.ok(wide && !wide.includes('glyph:'))
  for (const [file, output] of before.tsOutputs) {
    assert.equal(output.replaceAll(/\/\*\* Temporary[^\n]*\n/g, '').replaceAll(/\n\s*glyph:[^\n]*/g, ''), after.tsOutputs.get(file).replaceAll(/\n\s*glyph:[^\n]*/g, ''), file)
  }
})

/** Builds each lane the way app.config.js configures it, into a fresh output directory. */
async function buildLaneFonts(root, name, run = buildAllFonts) {
  const results = await run(
    LANES.map(lane => ({
      fontFamily: `icons-${lane}`,
      inputDir: `./assets/icons/${lane}`,
      outputDir: `./out-${name}`,
    })),
    root,
  )
  const fonts = {}
  for (const [index, lane] of LANES.entries()) {
    const result = results[index]
    const glyphmap = await fs.readFile(result.glyphmapPath, 'utf8')
    fonts[lane] = {family: result.family, glyphmap, map: JSON.parse(glyphmap), ttf: await fs.readFile(result.ttfPath)}
  }
  return fonts
}

function assertSameLane(actual, expected, lane) {
  assert.equal(actual.family, expected.family, `${lane} family`)
  assert.equal(actual.glyphmap, expected.glyphmap, `${lane} glyphmap`)
  assert.ok(actual.ttf.equals(expected.ttf), `${lane} TTF bytes`)
}

function assertSameFonts(actual, expected, lanes = LANES) {
  for (const lane of lanes) assertSameLane(actual[lane], expected[lane], lane)
}

function glyphNames(font) {
  return Object.keys(font.map.i).sort()
}

async function fontProject(t, files) {
  const project = await iconProject(t, files)
  let count = 0
  return {...project, fonts: () => buildLaneFonts(project.root, count++)}
}

test('temporary icons never change the unmodified library fonts', async t => {
  const project = await fontProject(t, NORMAL)
  const baseline = await project.fonts()
  assert.deepEqual(LANES.map(lane => glyphNames(baseline[lane]).length), [1, 1, 1])

  // Adding.
  await project.write('tmp/ui/Ota_Filled_Corner0_Rounded.svg', svgOf(DIAMOND))
  await project.write('tmp/brands/OtaBadge.svg', brandOf(8))
  await project.write('tmp/community/OtaService.svg', svgOf(DIAMOND))
  const added = await project.fonts()
  assertSameFonts(added, baseline)
  for (const lane of LANES) assert.equal(added[lane].map.m.h, baseline[lane].map.m.h, `${lane} hash`)
  for (const lane of LANES) assert.ok(!glyphNames(added[lane]).some(name => name.startsWith('Ota')), lane)

  // Editing.
  await project.write('tmp/ui/Ota_Filled_Corner0_Rounded.svg', svgOf(TRIANGLE))
  assertSameFonts(await project.fonts(), baseline)

  // Renaming.
  await project.move('tmp/ui/Ota_Filled_Corner0_Rounded.svg', 'tmp/ui/Renamed_Filled_Corner0_Rounded.svg')
  assertSameFonts(await project.fonts(), baseline)

  // Removing.
  for (const file of ['tmp/ui/Renamed_Filled_Corner0_Rounded.svg', 'tmp/brands/OtaBadge.svg', 'tmp/community/OtaService.svg']) {
    await project.remove(file)
  }
  assertSameFonts(await project.fonts(), baseline)
})

test('moving a temporary source into a lane changes only that lane font', async t => {
  const project = await fontProject(t, {...NORMAL, 'tmp/community/OtaService.svg': svgOf(DIAMOND), 'tmp/ui/Ota_Filled_Corner0_Rounded.svg': svgOf(DIAMOND)})
  const baseline = await project.fonts()
  assert.deepEqual(glyphNames(baseline.community), ['Service'])

  await project.move('tmp/community/OtaService.svg', 'community/OtaService.svg')
  const moved = await project.fonts()
  assertSameFonts(moved, baseline, ['ui', 'brands'])
  assert.deepEqual(glyphNames(moved.community), ['OtaService', 'Service'])
  assert.notEqual(moved.community.map.m.h, baseline.community.map.m.h)
  assert.notEqual(moved.community.family, baseline.community.family)
  assert.ok(!moved.community.ttf.equals(baseline.community.ttf))

  // The generated import path and the font glyph name now agree.
  const result = await project.build()
  assert.match(result.tsOutputs.get('community/OtaService.tsx'), /glyph: 'OtaService'/)
  assert.deepEqual(result.temporaryIcons, [path.join('tmp', 'ui', 'Ota_Filled_Corner0_Rounded.svg')])
})

const EXPO_BUILD = `
const fs = require('fs')
const [pluginPath, root, outputDir, resultPath] = process.argv.slice(2)
require(pluginPath)
  .getOrBuildFonts(root, ['ui', 'brands', 'community'].map(lane => ({
    fontFamily: 'icons-' + lane,
    inputDir: './assets/icons/' + lane,
    outputDir,
  })))
  .then(results => {
    fs.writeFileSync(resultPath, JSON.stringify(results))
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
`

/** The config plugin builder caches per process, so each scenario gets a fresh one. */
async function expoFonts(root, name) {
  const script = path.join(root, `expo-${name}.cjs`)
  const resultPath = path.join(root, `expo-${name}.json`)
  await fs.writeFile(script, EXPO_BUILD)
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [script, path.join(nanoDir, 'lib/commonjs/plugin/src/buildFonts.js'), root, `./out-expo-${name}`, resultPath],
      {cwd: root},
      error => (error ? reject(error) : resolve(undefined)),
    )
  })
  const results = JSON.parse(await fs.readFile(resultPath, 'utf8'))
  const fonts = {}
  for (const [index, lane] of LANES.entries()) {
    const glyphmap = await fs.readFile(results[index].glyphmapPath, 'utf8')
    fonts[lane] = {family: results[index].family, glyphmap, map: JSON.parse(glyphmap), ttf: await fs.readFile(results[index].ttfPath)}
  }
  return fonts
}

test('the Expo config plugin builder agrees with the CLI builder and skips tmp', async t => {
  const project = await fontProject(t, NORMAL)
  const baseline = await project.fonts()
  assertSameFonts(await expoFonts(project.root, 'baseline'), baseline)

  await project.write('tmp/ui/Ota_Filled_Corner0_Rounded.svg', svgOf(DIAMOND))
  await project.write('tmp/brands/OtaBadge.svg', brandOf(8))
  await project.write('tmp/community/OtaService.svg', svgOf(DIAMOND))
  const cli = await project.fonts()
  const expo = await expoFonts(project.root, 'tmp')
  assertSameFonts(expo, cli)
  assertSameFonts(expo, baseline)
  for (const lane of LANES) assert.ok(!glyphNames(expo[lane]).some(name => name.startsWith('Ota')), lane)

  await project.move('tmp/ui/Ota_Filled_Corner0_Rounded.svg', 'ui/Ota_Filled_Corner0_Rounded.svg')
  const movedExpo = await expoFonts(project.root, 'moved')
  assertSameFonts(movedExpo, await project.fonts())
  assert.deepEqual(glyphNames(movedExpo.ui), ['Base_Filled_Corner0_Rounded', 'Ota_Filled_Corner0_Rounded'])
})

test('font checks ignore temporary icons but still catch stale ordinary glyphmaps', async t => {
  const root = await tempRoot(t, 'icon-fonts-')
  await fs.symlink(path.resolve(nanoDir, '..'), path.join(root, 'node_modules'))
  await fs.writeFile(path.join(root, 'package.json'), '{"name":"fixture","version":"1.0.0"}')
  const iconSets = LANES.map(lane => ({
    fontFamily: `icons-${lane}`,
    inputDir: `./assets/icons/${lane}`,
    outputDir: './assets/nano-icons/nanoicons',
  }))
  await fs.writeFile(
    path.join(root, 'app.config.js'),
    `module.exports = {name: 'fixture', slug: 'fixture', plugins: [['react-native-nano-icons', {iconSets: ${JSON.stringify(iconSets)}}]]}\n`,
  )
  const write = async (relative, contents) => {
    await fs.mkdir(path.dirname(path.join(root, 'assets/icons', relative)), {recursive: true})
    await fs.writeFile(path.join(root, 'assets/icons', relative), contents)
  }
  for (const [relative, contents] of Object.entries(NORMAL)) await write(relative, contents)
  assert.deepEqual(await applyNanoFonts({check: false, repoRoot: root}), [])
  assert.deepEqual(await applyNanoFonts({check: true, repoRoot: root}), [])

  await write('tmp/ui/Ota_Filled_Corner0_Rounded.svg', svgOf(DIAMOND))
  await write('tmp/brands/OtaBadge.svg', brandOf(8))
  assert.deepEqual(await applyNanoFonts({check: true, repoRoot: root}), [])

  const glyphmap = path.relative(process.cwd(), path.join(root, 'assets/nano-icons/nanoicons/icons-ui.glyphmap.json'))
  await write('ui/Base_Filled_Corner0_Rounded.svg', svgOf(TRIANGLE))
  assert.deepEqual(await applyNanoFonts({check: true, repoRoot: root}), [glyphmap])
})
