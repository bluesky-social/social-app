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
    breakpoints: ReturnType<SystemTheme['getActiveBreakpoints']>
  }>({
    themeName: Object.keys(themes)[0],
    theme: defaultTheme,
    themes,
    breakpoints: defaultTheme.getActiveBreakpoints({
      width: Dimensions.get('window').width,
    }),
  })

  const ThemeProvider = ({
    children,
    theme: themeName,
  }: React.PropsWithChildren<{theme: ThemeName}>) => {
    const theme = themes[themeName]
    const [breakpoints, setBreakpoints] = React.useState(() =>
      theme.getActiveBreakpoints({width: Dimensions.get('window').width}),
    )

    React.useEffect(() => {
      const listener = Dimensions.addEventListener('change', ({window}) => {
        const bp = theme.getActiveBreakpoints({width: window.width})
        if (bp.current !== breakpoints.current) setBreakpoints(bp)
      })

      return listener.remove
    }, [breakpoints, theme, setBreakpoints])

    return (
      <Context.Provider
        value={React.useMemo(
          () => ({
            themeName: themeName,
            theme,
            themes,
            breakpoints,
          }),
          [theme, themeName, breakpoints],
        )}>
        {children}
      </Context.Provider>
    )
  }

  function useTheme() {
    return React.useContext(Context)
  }

  function useTokens() {
    return useTheme().theme.config.tokens
  }

  function useBreakpoints() {
    return useTheme().breakpoints
  }

  function useStyle(props: ResponsiveStyleProps) {
    const {theme, breakpoints} = useTheme()
    return React.useMemo(
      () => theme.style(props as StylesAndProps, breakpoints.active).styles,
      [breakpoints.active, props, theme],
    )
  }

  // TODO we don't get full intellisense from this hook, find out why
  function useStyles<O extends Record<string, ResponsiveStyleProps>>(
    styles: O,
  ): {
    [Name in keyof O]: ReturnType<SystemTheme['style']>['styles']
  } {
    const {theme, breakpoints} = useTheme()
    return React.useMemo(() => {
      const acc = {} as {
        [Name in keyof O]: ReturnType<SystemTheme['style']>['styles']
      }
      for (const key in styles) {
        acc[key as keyof O] = theme.style(
          styles[key] as StylesAndProps,
          breakpoints.active,
        ).styles
      }
      return acc
    }, [styles, breakpoints.active, theme])
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
      const {theme, breakpoints} = useTheme()
      const {styles, props: rest} = React.useMemo(
        () =>
          theme.style<Props>(
            {
              ...defaultProps,
              ...props,
            },
            breakpoints.active,
          ),
        [breakpoints.active, props, theme],
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
