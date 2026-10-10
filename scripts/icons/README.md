# Icon codegen

SVG files under `assets/icons/` are the source of truth. Generated components under
`src/components/icons/` are committed so icon changes stay visible in review.

## Workflow

1. Name the SVG after its exact TypeScript export, for example
   `ArrowTop_Stroke2_Corner0_Rounded.svg`.
   Files in `ui/` must use a semantic name followed only by style tokens and include `Filled` or
   `StrokeN`, `CornerN`, and `Rounded`. Brand and community marks are exempt because their public
   names are not UI-style variants.
2. Put it in the directory whose policy it needs:
   - `ui/` — strict monochrome icons; exactly one optimized path
   - `brands/` — brand marks that may preserve multiple paint roles or basic shapes
   - `community/` — third-party marks
   - `custom/` — raw assets, including multi-path exceptions, that are optimized but not
     component-generated
   - `flags/` — runtime assets, excluded from codegen and optimization
3. Run `pnpm icons:generate` and commit the SVG, the generated TypeScript, and the rebuilt fonts in
   `assets/nano-icons/nanoicons/`.

`pnpm icons:check` verifies that optimized SVGs and generated TypeScript are current, that the
font glyphmaps match a fresh build, and that the font files exist.
`pnpm icons:test` runs the focused generator tests. Generation warns, but does not fail, when a
generated icon uses a viewBox other than 24×24 or 64×64.

## Output grouping

Grouping has no per-icon manifest. The generator removes style suffixes, tokenizes semantic
names, buckets them by the first token, and uses the longest shared token prefix as the module
family. A singleton uses its complete semantic name. Brand and community modules remain in
their own namespaces.

When an existing application import points at an older module, codegen emits a deprecated
constant alias at that path. This preserves component identity while making the canonical import
visible to editors. Run `pnpm icons:generate -- --verbose` to list the remaining deprecated
imports and their locations.

## Font glyphs

On iOS and Android, generated icons render as glyphs from [react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
fonts, one per directory (`icons-ui`, `icons-brands`, `icons-community`), built from the same SVGs
by its config plugin in `app.config.js`. Codegen passes each icon's glyph name to
`createSinglePathSVG` or `createSVG` as `glyph`, typed against the committed glyphmaps (see
`withNanoGlyph` in `src/components/icons/nano.tsx`). An icon falls back to react-native-svg for
props a glyph cannot honour, such as `gradient`. Web always renders the SVG icons.

An icon stays on react-native-svg when its glyph would not match the SVG icon: a non-square
viewBox (glyphs are sized by height, SVG icons letterbox into a square), or a fill path that
`createSinglePathSVG` renders with evenodd but whose SVG file does not declare it, where the two
fill rules differ by more than 0.1% of the viewBox. Declare `fill-rule="evenodd"` in such SVGs.
