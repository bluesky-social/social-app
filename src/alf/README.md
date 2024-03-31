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

```tsx
const b = useBreakpoints()

if (b.gtMobile) {
  // render tablet or desktop UI
}
```
