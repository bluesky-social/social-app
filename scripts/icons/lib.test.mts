import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  applyIconSet,
  assignFamilies,
  buildIconSet,
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
