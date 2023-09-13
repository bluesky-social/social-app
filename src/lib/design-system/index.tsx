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

import {Theme, light} from './themes'

type ComponentProps = Partial<ViewProps & TextProps & ImageProps>
export type Props<T = ComponentProps> = Parameters<typeof light.pick<T>>[0] & {
  /**
   * Debug mode will log the styles and props to the console
   */
  debug?: boolean
}
type HeadingElements = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type TypeProps = Props<TextProps> & {
  as?: HeadingElements
}

const Context = React.createContext({theme: light})

export const ThemeProvider = ({
  children,
  theme,
}: React.PropsWithChildren<{theme: Theme}>) => (
  <Context.Provider value={{theme}}>{children}</Context.Provider>
)

export function useBreakpoints() {
  const {theme} = React.useContext(Context)
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

export function useStyles<T = ComponentProps>(props: Props<T> & T) {
  const {theme} = React.useContext(Context)
  const breakpoints = useBreakpoints()
  const {
    styles: responsiveStyles,
    props: {debug, ...rest},
  } = React.useMemo(
    () => theme.pick<T & Pick<Props, 'debug'>>(props),
    [props, theme],
  )
  const styles = React.useMemo(() => {
    return theme.style(
      theme.applyBreakpoints(responsiveStyles, breakpoints.active),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsiveStyles, breakpoints.current, theme])

  if (debug) {
    console.debug({styles, props: rest, breakpoints})
  }

  return {styles, props: rest}
}

export const Box = React.forwardRef<View, Props<ViewProps>>(function BoxThemed(
  {children, style, ...props},
  ref,
) {
  const {styles, props: rest} = useStyles<ViewProps>(props)
  return (
    <View {...rest} style={[styles, style]} ref={ref}>
      {children}
    </View>
  )
})

export const Text = React.forwardRef<RNText, Props<TextProps>>(
  function TextThemed({children, style, ...props}, ref) {
    const {styles, props: rest} = useStyles<TextProps>({
      color: 'text',
      ...props,
    })
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
  [key in HeadingElements]: Props
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
    const {styles, props: rest} = useStyles({
      color: 'text',
      ...merge(asToTypeStyles[asEl], props),
    })

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
