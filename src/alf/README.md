# Application Layout Framework (ALF)

A set of UI primitives and components.

## Usage

Naming conventions follow Tailwind — delimited with a `_` instead of `-` to
enable object access — with a couple exceptions:

**Spacing**

Uses "t-shirt" sizes `xxs`, `xs`, `sm`, `md`, `lg`, `xl` and `xxl` instead of
increments of 4px. We only use a few common spacings, and otherwise typically
rely on many one-off values.

**Text Size**

Uses "t-shirt" sizes `xxs`, `xs`, `sm`, `md`, `lg`, `xl` and `xxl` to match our
type scale.

**Line Height**

The text size atoms also apply a line-height with the same value as the size,
for a 1:1 ratio. `tight` and `normal` are retained for use in the few places
where we need leading.

### Atoms

An (mostly-complete) set of style definitions that match Tailwind CSS selectors.
These are static and reused throughout the app.

```tsx
import { atoms } from '#/alf'

<View style={[atoms.flex_row]} />
```

### Theme

Any values that rely on the theme, namely colors.

```tsx
const t = useTheme()

<View style={[atoms.flex_row, t.atoms.bg]} />
```

### Breakpoints

Web and iPad use the same width thresholds: `gtPhone` at 500, `gtMobile` at
800, and `gtTablet` at 1300. On iPad, these follow the current app window, not
the device's screen or model. A mini in portrait stays below `gtMobile`; the
same device in landscape can show the sidebar. Split View and window resizing
can cross these thresholds without an orientation change.

Other native devices retain their compact layout. Width does not imply a
mouse or hover support: keep touch actions available on iPad even when
`gtMobile` is true.

`useLayoutBreakpoints().rightNavVisible` stays false on native because the
native shell has no right rail. Feed modules that move into that rail on web
must remain in the native feed.

```tsx
const b = useBreakpoints()

if (b.gtMobile) {
  // render tablet or desktop UI
}
```
