import React from 'react'
import {Dimensions} from 'react-native'

import {
  Theme,
  ResponsiveStyles,
  Tokens,
  Properties,
  Macros,
  Breakpoints,
} from './theme'

type ThemeConfig<
  T extends Tokens,
  P extends Properties,
  M extends Macros<T>,
  B extends Breakpoints,
> = {
  [key: string]: Theme<T, P, M, B>
}

export function createSystem<
  T extends Tokens,
  P extends Properties,
  M extends Macros<T>,
  B extends Breakpoints,
>(themes: ThemeConfig<T, P, M, B>) {
  const defaultTheme = Object.values(themes)[0]

  type SystemTheme = Theme<T, P, M, B>
  type ResponsiveStyleProps = ResponsiveStyles<T, P, M, B>
  type StylesAndProps = Parameters<typeof defaultTheme.style<any>>[0]
  type DebugProps = {
    /**
     * Debug mode will log the styles and props to the console
     */
    debug?: boolean
  }

  type ThemeName = keyof typeof themes
  const Context = React.createContext<{
    themeName: ThemeName
    theme: SystemTheme
    themes: {
      [key in ThemeName]: SystemTheme
    }
  }>({
    themeName: Object.keys(themes)[0],
    theme: defaultTheme,
    themes,
  })

  const ThemeProvider = ({
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

  function useTheme() {
    return React.useContext(Context)
  }

  function useTokens() {
    return React.useContext(Context).theme.config.tokens
  }

  function useBreakpoints() {
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

  function useStyle(props: ResponsiveStyleProps) {
    const {theme} = useTheme()
    const breakpoints = useBreakpoints()
    return theme.style(props as StylesAndProps, breakpoints.active).styles
  }

  function useStyles<O extends Record<string, ResponsiveStyleProps>>(
    styles: O,
  ): {
    [Name in keyof O]: ReturnType<SystemTheme['style']>['styles']
  } {
    const {theme} = useTheme()
    const breakpoints = useBreakpoints()
    return React.useMemo(() => {
      return Object.entries(styles).reduce((acc, [key, style]) => {
        acc[key as keyof O] = theme.style(
          style as StylesAndProps,
          breakpoints.active,
        ).styles
        return acc
      }, {} as {[Name in keyof O]: ReturnType<SystemTheme['style']>['styles']})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [styles, breakpoints.current, theme])
  }

  function styled<Props extends Record<string, any>>(
    Component: React.ComponentType<Props>,
    defaultProps: ResponsiveStyleProps = {},
  ) {
    const comp = React.forwardRef<
      Props,
      Props &
        ResponsiveStyleProps &
        DebugProps & {children?: React.ReactNode | React.ReactNodeArray}
    >((props, ref) => {
      const {theme} = useTheme()
      const breakpoints = useBreakpoints()
      const {styles, props: rest} = theme.style<Props>(
        {
          ...defaultProps,
          ...props,
        },
        breakpoints.active,
      )
      if (props.debug) console.log({styles, props: rest})
      return <Component {...rest} style={[styles, rest.style]} ref={ref} />
    })

    comp.displayName = Component.displayName || 'NovaComponent'

    return comp
  }

  return {
    Context,
    ThemeProvider,
    useTheme,
    useTokens,
    useBreakpoints,
    useStyle,
    useStyles,
    styled,
  }
}
