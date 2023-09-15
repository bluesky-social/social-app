import React from 'react'
import {
  View,
  Text as RNText,
  Dimensions,
  Platform,
  ViewProps,
  TextProps,
  ImageProps,
} from 'react-native'
import merge from 'lodash.merge'

import {Theme, light, dark} from './themes'

type NativeProps = Partial<ViewProps & TextProps & ImageProps>
export type StyleProps = Parameters<typeof light.style>[0] &
  Record<string, unknown>
export type ComponentProps<T = NativeProps> = Parameters<
  typeof light.pick<T>
>[0] & {
  /**
   * Debug mode will log the styles and props to the console
   */
  debug?: boolean
}
type HeadingElements = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type TypeProps = ComponentProps<TextProps> & {
  as?: HeadingElements
}

const themes = {
  light,
  dark,
}
type ThemeName = keyof typeof themes
const Context = React.createContext<{
  themeName: ThemeName
  theme: Theme
  themes: {
    [key in ThemeName]: Theme
  }
}>({
  themeName: 'light',
  theme: light,
  themes: {
    light,
    dark,
  },
})

export const ThemeProvider = ({
  children,
  theme,
}: React.PropsWithChildren<{theme: ThemeName}>) => (
  <Context.Provider
    value={{
      themeName: theme,
      theme: themes[theme],
      themes,
    }}>
    {children}
  </Context.Provider>
)

export function useTheme() {
  return React.useContext(Context)
}

export function useBreakpoints() {
  const {theme} = useTheme()
  const [breakpoints, setBreakpoints] = React.useState(
    theme.getActiveBreakpoints({width: Dimensions.get('window').width}),
  )

  React.useEffect(() => {
    const listener = Dimensions.addEventListener('change', ({window}) => {
      const bp = theme.getActiveBreakpoints({width: window.width})
      if (bp.current !== breakpoints.current) setBreakpoints(bp)
    })

    return () => {
      listener.remove()
    }
  }, [breakpoints, theme])

  return breakpoints
}

export function usePick<T = NativeProps>(props: ComponentProps<T>) {
  const {theme} = useTheme()
  return React.useMemo(() => theme.pick(props), [props, theme])
}

export function useStyle(props: StyleProps) {
  const {theme} = useTheme()
  const breakpoints = useBreakpoints()
  const {styles: responsiveStyles} = usePick(props)
  return React.useMemo(() => {
    return theme.style(
      theme.applyBreakpoints(responsiveStyles, breakpoints.active),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsiveStyles, breakpoints.current, theme])
}

export function useStyles<O extends Record<string, StyleProps>>(
  styles: O,
): {
  [Name in keyof O]: ReturnType<typeof light.style>
} {
  const {theme} = useTheme()
  const breakpoints = useBreakpoints()
  return React.useMemo(() => {
    return Object.entries(styles).reduce((acc, [key, style]) => {
      const responsiveStyles = theme.pick(style).styles
      acc[key as keyof O] = theme.style(
        theme.applyBreakpoints(responsiveStyles, breakpoints.active),
      )
      return acc
    }, {} as {[Name in keyof O]: ReturnType<typeof light.style>})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles, breakpoints.current, theme])
}

export const Box = React.forwardRef<View, ComponentProps<ViewProps>>(
  function BoxThemed({children, style, ...props}, ref) {
    const {styles: pickedStyles, props: rest} = usePick<ViewProps>(props)
    const styles = useStyle(pickedStyles)
    if (props.debug) console.log({styles: pickedStyles, props: rest})
    return (
      <View {...rest} style={[styles, style]} ref={ref}>
        {children}
      </View>
    )
  },
)

export const Text = React.forwardRef<RNText, ComponentProps<TextProps>>(
  function TextThemed({children, style, ...props}, ref) {
    const {styles: pickedStyles, props: rest} = usePick<TextProps>(props)
    const styles = useStyle({
      color: 'text',
      ...pickedStyles,
    })
    if (props.debug) console.log({styles, props: rest})
    return (
      <RNText {...rest} style={[styles, style]} ref={ref}>
        {children}
      </RNText>
    )
  },
)

const asToAriaLevel = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
}

const asToTypeStyles: {
  [key in HeadingElements]: ComponentProps
} = {
  h1: {
    fontSize: 'l',
    lineHeight: 'l',
    gtPhone: {
      fontSize: 'xl',
      lineHeight: 'xl',
    },
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
  },
  h5: {
    fontSize: 14,
    lineHeight: 20,
  },
  h6: {
    fontSize: 12,
    lineHeight: 16,
  },
}

export const P = React.forwardRef<RNText, TypeProps>(function PThemed(
  props,
  ref,
) {
  // @ts-expect-error role is web only
  return <Text role="paragraph" c="text" {...props} ref={ref} />
})

/**
 * @see https://necolas.github.io/react-native-web/docs/accessibility/#semantic-html
 * @see https://docs.expo.dev/develop/user-interface/fonts/
 */
function createHeadingComponent(element: HeadingElements) {
  return React.forwardRef<RNText, TypeProps>(function HeadingThemed(
    {children, style, as, ...props},
    ref,
  ) {
    const asEl = as || element
    const extra = Platform.select({
      web: {
        'aria-level': asToAriaLevel[element],
      },
      default: {},
    })
    const {styles: pickedStyles, props: rest} = usePick<TextProps>(props)
    const styles = useStyle({
      color: 'text',
      ...merge(asToTypeStyles[asEl], pickedStyles),
    })
    if (props.debug) console.debug({styles, props: rest})

    return (
      <RNText
        role="heading"
        {...extra}
        {...rest}
        style={[styles, style]}
        ref={ref}>
        {children}
      </RNText>
    )
  })
}

export const H1 = createHeadingComponent('h1')
export const H2 = createHeadingComponent('h2')
export const H3 = createHeadingComponent('h3')
export const H4 = createHeadingComponent('h4')
export const H5 = createHeadingComponent('h5')
export const H6 = createHeadingComponent('h6')
