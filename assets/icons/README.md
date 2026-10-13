**Rights holder: Iconists (David & Storm GbR).**

The user-interface glyphs in [`ui/`](./ui/) come from their [Central icon system](https://iconists.co/central). Bluesky Social PBC licenses them for use in our own products. **That license is for our own use, and it does not extend to you.**

**These icons are not covered by the [MIT license](../../LICENSE) that applies to the rest of this repository.** The fact that we have our own license does not mean that you cannot use these icons. It means that any right you have to use them has to come from Iconists, not us. Licenses are available from [iconists.co](https://iconists.co), and there are openly licensed alternatives if you prefer that.

This notice covers the SVG files in `ui/`, plus any Central glyphs deliberately kept as raw
multi-path artwork in `custom/`. It does not cover:

| Not covered here | Rights holder | See |
|---|---|---|
| `flags/` | @catamphetamine, MIT licensed | [`flags/README.md`](./flags/README.md) |
| `community/` | Third-party services | [`community/README.md`](./community/README.md) |
| `brands/` | Bluesky Social PBC, Apple Inc., and Google LLC | [`ASSETS.md`](../../ASSETS.md#3-bluesky-trademarks-and-brand-assets) and [`ASSETS.md`](../../ASSETS.md#5-third-party-trademarks) |
| Non-Central artwork in `custom/` | Its respective rights holder | [`ASSETS.md`](../../ASSETS.md) |

Adding an icon? Give the SVG its exact TypeScript export name, place it in the policy directory
that describes it, and run `pnpm icons:generate`. Names in `ui/` must include their style tokens,
for example `ArrowTop_Stroke2_Corner0_Rounded.svg`; codegen rejects bare or incomplete names. If
it came from Central, this notice already covers it. If it came from anywhere else, add it to
[`ASSETS.md`](../../ASSETS.md) so the notice does not go stale.
