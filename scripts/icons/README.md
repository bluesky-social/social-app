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
3. Run `pnpm icons:generate` and commit both the SVG and generated TypeScript.

`pnpm icons:check` verifies that optimized SVGs and generated TypeScript are current.
`pnpm icons:test` runs the focused generator tests. `pnpm icons:optimize` remains an alias for
generation during the workflow transition. Generation warns, but does not fail, when a generated
icon uses a viewBox other than 24×24 or 64×64.

## Output grouping

Grouping has no per-icon manifest. The generator removes style suffixes, tokenizes semantic
names, buckets them by the first token, and uses the longest shared token prefix as the module
family. A singleton uses its complete semantic name. Brand and community modules remain in
their own namespaces.

When an existing application import points at an older module, codegen emits a deprecated
constant alias at that path. This preserves component identity while making the canonical import
visible to editors. Run `pnpm icons:generate -- --verbose` to list the remaining deprecated
imports and their locations.
