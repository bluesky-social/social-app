# Application Layout Framework (ALF)

ALF is a low-level styling system inspired by prior art like
[styled-system](https://github.com/styled-system/styled-system) and others.

It consists of two core parts: one or more **themes** and a single **system**.
Although a theme really comes first, you'll most often interact with the system,
so we'll start there.

## System

The _system_ is just the "layout system", and it's created from a set of themes.

```typescript
import {createSystem} from '#/alf/lib/system'
import {light, dark} from '#/alf/themes'

const {
  ThemeProvider,
  styled,
  useStyle,
  useStyles,
  useTheme,
  useTokens,
  useBreakpoints,
} = createSystem({
  light,
  dark,
})
```

### ThemeProvider

The `ThemeProvider` expects a single prop `theme`, which corresponds to the
_keys_ of the object passed to `createSystem`, which should correspond to your
theme names. Using the above, `theme` should be `light` or `dark`.


```typescript
<ThemeProvider theme='light'>...</ThemeProvider>
```

### styled

Convenience method to create a themeable component from another primitive.
Accepts a component and an object of default styles. Typically only be used in a
few places, like for creating primitive `Box` and `Text` components.

**Do not get carried away with this. Multiple levels of nesting is performance
intensive, and is hard to debug.**

```tsx
import {styled} from '#/alf/system'

const Box = styled(View, {})

<Box c='primary' gtMobile={{ pa: 'm' }} />
```

> An additional feature of `styled` components is a boolean `debug` prop that
> will print the processed styles and properties to the console.

### useStyle

Mid-level hook to create themed styles with the full theme config at your
disposal. Most often helpful when styling 3rd party libraries, such as a
dropdown.

```tsx
const styles = useStyle({
  c: 'primary',
  gtMobile: {
    c: 'secondary',
  },
})

<DropdownItem style={styles} />
```

### useStyles

Mid-level hook to create _named_ and themed styles with the full theme config at
your disposal. Most often helpful when styling 3rd party libraries, such as a
dropdown. Think of this as similar to `StyleSheet.create`.

```typescript
const { outer, header } = useStyles({
  outer: {
    px: 'm',
    gtMobile: {
      px: 'l',
    },
  },
  header: {
    fontSize: 'xl',
  }
})

<View style={outer}>
  <Text style={header}>Hello</Text>
</View>
```

### useTheme

Returns the full currently-active theme object e.g. `light` or `dark`, and all utils attached.
Really only used when you need low-level access.

```typescript
const theme = useTheme()
const styles = theme.style({
  c: 'blue',
})
```

### useTokens

Returns just the design tokens of the currently-active theme.

```tsx
const tokens = useTokens()

<View style={{ color: tokens.color.blue }} />
```

### useBreakpoints

Returns the current and active breakpoints, which are stored on the theme
context.

```typescript
const { current, active } = useBreakpoints()

// =>
{
  current: 'gtTablet',
  active: [
    'gtTablet',
    'gtMobile',
  ]
}
```

## Themes

Themes are made up of a collection of utilities and created from a set of design
tokens and other configuration. They are external to React, and can be used
directly if low-level access is needed.

### Creating a theme

```typescript
import {createTheme} from '#/alf/lib/theme'

const light = createTheme(config)
```

Config consists of:

#### Tokens

Tokens a.k.a. "design tokens", are the smallest building block of the design
system. The name of each token directly corresponds to the name of the CSS
property, with the exception of `space`, which is used as a value source for
properties like `width` unless a specific `width` scale is configured.

```typescript
createTheme({
  tokens: {
    // special token in ALF
    space: {
      s: 8,
      m: 12,
      l: 18,
    },
    // matches CSS prop name exactly
    color: {
      blue: '#0000FF',
    },
    // matches CSS prop name exactly
    fontSize: {
      s: 14,
      m: 16,
      l: 18,
    }
  }
})
```

#### Properties

Properties are a mapping property names to actual CSS properties. Internally,
ALF specifies a mapping of all supported CSS properties. When creating a theme
is a time to specify "shorthands" or "aliases" a.k.a. syntax sugar. Docblocks
will persist and be available for intellisense.

```typescript
createTheme({
  tokens: {...},
  properties: {
    /** Alias for `width` */
    w: ['width'],
    /** Alias for `color` */
    c: ['color'],
    /** Alias for all directional margin properties */
    ma: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
  }
})
```

#### Breakpoints

In ALF, breakpoints are applied as the equivalent of `min-width` CSS media
queries, meaning your base styles are mobile, and breakpoints are then applied
in order. You can name these anything you want, but we recommend the `gt`
prefix; basically "greater than N".

Given the below, at 1000px wide, both the base and the styles applied in
`gtMobile` will be applied.


```typescript
createTheme({
  tokens: {...},
  properties: {...},
  breakpoints: {
    /** Greater than 800 */
    gtMobile: 800,
    /** Greater than 1300 */
    gtTablet: 1300,
  }
})
```

#### Macros

Macros are further syntax sugar. They can be configured as boolean attributes,
as allowing a specific set of values, as simple generic methods, or a
combination.

```typescript
createTheme({
  tokens: {...},
  properties: {...},
  breakpoints: {...},
  macros: {
    /** Shorthand for `flexDirection: 'row'` */
    row: (_: boolean) => ({flexDirection: 'row', flex: 1}),
    /**
     * Shorthand for `flex: 1`. Optionally pass an integer to specify the
     * col-span.
     *
     * Semantically this is helpful as a direct child of `<Box row>`
     *
     * @example
     * <Box row>
     *   <Box column>
     *     <Text>Hello</Text>
     *   </Box>
     *   <Box column={2}>
     *     <Text>Hello</Text>
     *   </Box>
     * </Box>
     */
    column: (span: boolean | number) => ({
      flex: typeof span === 'number' ? span : 1,
    }),
    /** Shorthand for `alignItems: 'center'` */
    aic: (_: boolean) => ({alignItems: 'center'}),
  }
})
```

Given the above config, creating a grid with `Box` (see next section) is as
simple as:

```tsx
<Box row aic>
  {/* 1/4 width */}
  <Box column></Box>

  {/* 1/2 width */}
  <Box column={2}></Box>

  {/* 1/4 width */}
  <Box column></Box>
</Box>
```

## Performance considerations

### Memoize style objects

For primitive components or those that render often, it's probably a good idea
to memoize your style objects prior to passing them to one of the hooks or
`Box`.

```typescript
function Component(props) {
  const styles = useStyle(React.useMemo(() => ({
    color: props.prop ? 'blue' : 'red',
  }), [props.prop]))

  return <View style={styles} />
}
```

### Pre-define styles for list views

For some simple `FlatList`s, you may be able to pre-define styles for list
components, and pass them in as properties, instead of computing new styles for
each component.
