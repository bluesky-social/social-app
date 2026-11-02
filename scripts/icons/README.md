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
props a glyph cannot honour, such as `gradient` or a `ref`, and in development warns once when it
does so for a prop that could be avoided. Web always renders the SVG icons.

An icon stays on react-native-svg when its glyph would not match the SVG icon: a non-square
viewBox (glyphs are sized by height, SVG icons letterbox into a square), or a fill path that
`createSinglePathSVG` renders with evenodd but whose SVG file does not declare it, where the two
fill rules differ by more than 0.1% of the viewBox. Declare `fill-rule="evenodd"` in such SVGs.

## Temporary SVG-only icons for OTA updates

Fonts are native assets, so a new glyph needs a native release. To ship a new icon over the air
first, put its source under `assets/icons/tmp/` instead of its normal directory:

```text
assets/icons/tmp/ui/NewThing_Stroke2_Corner0_Rounded.svg
    -> src/components/icons/NewThing.tsx
```

The layout is exactly `tmp/ui/`, `tmp/brands/`, or `tmp/community/`, one level deep. Each directory
has the policy of the lane it is named after, so validation, naming, export names, and output
namespaces are the same as for a normal source. `tmp/custom/`, `tmp/flags/`, any other directory,
and deeper nesting are rejected. Run `pnpm icons:generate` as usual. A temporary icon:

- is generated as an ordinary export in its normal module and namespace (a `tmp/brands/` source ends
  up in `src/components/icons/brands/`), so imports do not change when it is later moved;
- has no `glyph`, so every platform renders it with react-native-svg;
- is not in any font input: `app.config.js` only lists `assets/icons/{ui,brands,community}`, so the
  unmodified react-native-nano-icons CLI, `pnpm icons:generate`, and the Expo config plugin during
  prebuild never read `tmp/`. Adding, editing, renaming, or removing one changes no font, glyphmap,
  or font hash;
- is optimized and kept fresh like any other source: `pnpm icons:check` still requires its SVG and
  generated TypeScript to be current;
- is marked by a docblock on its export, `Temporary SVG-only icon. Move its source to
  assets/icons/<lane>/ before a native release.`, and listed by the generator (informational, never
  a failure).

Only use `tmp/` for new icons that are not in the fonts of any released binary. Moving the source
of an icon that already ships in a font into `tmp/` removes its glyph from the font on the next
regeneration. That changes the font inputs and is not an OTA-safe way to change that icon.

### Before a native release

List the pending sources, move each into the lane its directory names, regenerate, and commit the
SVG, TypeScript, and font changes:

```sh
find assets/icons/tmp -type f -name '*.svg'
git mv assets/icons/tmp/ui/NewThing_Stroke2_Corner0_Rounded.svg assets/icons/ui/
pnpm icons:generate
```

There is no automatic rewrite or release-time failure. The generated namespace and export stay the
same, the cleanup docblock disappears, and icons that pass the glyph-equivalence checks above gain a
glyph and enter that lane's font. That changes the font binary, glyphmap, and native compatibility,
so it needs a native build. Icons that fail the checks keep the SVG fallback.
