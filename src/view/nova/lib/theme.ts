import type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  DimensionValue,
  ColorValue,
} from 'react-native'
import {StyleSheet} from 'react-native'

type StyleObject = ViewStyle & TextStyle & ImageStyle
type StyleObjectProperties = keyof StyleObject
type ColorProperties =
  | 'color'
  | 'backgroundColor'
  | 'borderColor'
  | 'borderTopColor'
  | 'borderRightColor'
  | 'borderBottomColor'
  | 'borderLeftColor'
type DimensionProperties =
  | 'padding'
  | 'paddingTop'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingVertical'
  | 'paddingHorizontal'
  | 'margin'
  | 'marginTop'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginRight'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'gap'
  | 'rowGap'
  | 'columnGap'

export type Tokens = {
  space?: DimensionValue[] | Record<string, DimensionValue>
} & {
  [Property in StyleObjectProperties]?: Record<
    string,
    Required<StyleObject>[Property]
  >
}
export type Properties = Record<string, Readonly<StyleObjectProperties[]>>
export type Macros<T extends Tokens> = Record<
  string,
  (value: any, tokens: T) => StyleObject
>
export type Breakpoints = {
  [Breakpoint: string]: number
}

export type Styles<
  T extends Tokens,
  P extends Properties,
  M extends Macros<T>,
> = {
  [Property in ColorProperties]?:
    | keyof T['color']
    | Omit<ColorValue, keyof T['color']>
} & {
  [Property in DimensionProperties]?: keyof T['space'] | DimensionValue
} & {
  [Property in Exclude<
    StyleObjectProperties,
    ColorProperties | DimensionProperties
  >]?: keyof T[Property] | StyleObject[Property]
} & {
  // this empty P is to avoid circular references back to Properties type
  [Property in keyof P]?: Styles<T, {}, M>[P[Property][0]]
} & {
  [Property in keyof M]?: M[Property] extends (
    value: infer Value,
    tokens: T,
  ) => StyleObject
    ? Value
    : never
}

export type ResponsiveStyles<
  T extends Tokens,
  P extends Properties,
  M extends Macros<T>,
  B extends Breakpoints,
> =
  | Styles<T, P, M>
  | {
      [Breakpoint in keyof B]?: Styles<T, P, M>
    }

export type Theme<
  T extends Tokens,
  P extends Properties,
  M extends Macros<T>,
  B extends Breakpoints,
> = {
  config: {
    tokens: T
    properties: P
    macros: M
    breakpoints: B
  }
  style: <Props>(
    props: ResponsiveStyles<T, P, M, B> & Omit<Props, keyof P>,
    breakpoints?: (keyof B)[],
  ) => {
    styles: StyleObject
    props: Props
  }
  getActiveBreakpoints: ({width}: {width: number}) => {
    active: (keyof B)[]
    current: keyof B
  }
}

const specialTokenMapping = {
  color: 'color',
  backgroundColor: 'color',
  borderColor: 'color',
  borderTopColor: 'color',
  borderRightColor: 'color',
  borderBottomColor: 'color',
  borderLeftColor: 'color',
  padding: 'space',
  paddingTop: 'space',
  paddingBottom: 'space',
  paddingLeft: 'space',
  paddingRight: 'space',
  paddingVertical: 'space',
  paddingHorizontal: 'space',
  margin: 'space',
  marginTop: 'space',
  marginBottom: 'space',
  marginLeft: 'space',
  marginRight: 'space',
  top: 'space',
  bottom: 'space',
  left: 'space',
  right: 'space',
  gap: 'space',
  rowGap: 'space',
  columnGap: 'space',
}

const propertyMapping: Properties = {
  // FlexStyle
  alignContent: ['alignContent'],
  alignItems: ['alignItems'],
  alignSelf: ['alignSelf'],
  aspectRatio: ['aspectRatio'],
  borderBottomWidth: ['borderBottomWidth'],
  borderEndWidth: ['borderEndWidth'],
  borderLeftWidth: ['borderLeftWidth'],
  borderRightWidth: ['borderRightWidth'],
  borderStartWidth: ['borderStartWidth'],
  borderTopWidth: ['borderTopWidth'],
  borderWidth: ['borderWidth'],
  bottom: ['bottom'],
  display: ['display'],
  end: ['end'],
  flex: ['flex'],
  flexBasis: ['flexBasis'],
  flexDirection: ['flexDirection'],
  rowGap: ['rowGap'],
  gap: ['gap'],
  columnGap: ['columnGap'],
  flexGrow: ['flexGrow'],
  flexShrink: ['flexShrink'],
  flexWrap: ['flexWrap'],
  height: ['height'],
  justifyContent: ['justifyContent'],
  left: ['left'],
  margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
  marginBottom: ['marginBottom'],
  marginEnd: ['marginEnd'],
  marginHorizontal: ['marginLeft', 'marginRight'],
  marginLeft: ['marginLeft'],
  marginRight: ['marginRight'],
  marginStart: ['marginStart'],
  marginTop: ['marginTop'],
  marginVertical: ['marginTop', 'marginBottom'],
  maxHeight: ['maxHeight'],
  maxWidth: ['maxWidth'],
  overflow: ['overflow'],
  padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  paddingBottom: ['paddingBottom'],
  paddingEnd: ['paddingEnd'],
  paddingHorizontal: ['paddingLeft', 'paddingRight'],
  paddingLeft: ['paddingLeft'],
  paddingRight: ['paddingRight'],
  paddingStart: ['paddingStart'],
  paddingTop: ['paddingTop'],
  paddingVertical: ['paddingTop', 'paddingBottom'],
  position: ['position'],
  right: ['right'],
  start: ['start'],
  top: ['top'],
  width: ['width'],
  zIndex: ['zIndex'],
  direction: ['direction'],

  // ShadowStyle
  shadowColor: ['shadowColor'],
  shadowOffset: ['shadowOffset'],
  shadowOpacity: ['shadowOpacity'],
  shadowRadius: ['shadowRadius'],

  // TransformStyle
  transform: ['transform'],
  transformMatrix: ['transformMatrix'],
  rotation: ['rotation'],
  scaleX: ['scaleX'],
  scaleY: ['scaleY'],
  translateX: ['translateX'],
  translateY: ['translateY'],

  // ViewStyle
  backfaceVisibility: ['backfaceVisibility'],
  backgroundColor: ['backgroundColor'],
  borderBlockColor: ['borderBlockColor'],
  borderBlockEndColor: ['borderBlockEndColor'],
  borderBlockStartColor: ['borderBlockStartColor'],
  borerBottomColor: ['borderBottomColor'],
  borderBottomEndRadius: ['borderBottomEndRadius'],
  borderBottomLeftRadius: ['borderBottomLeftRadius'],
  borderBottomRightRadius: ['borderBottomRightRadius'],
  borderBottomStartRadius: ['borderBottomStartRadius'],
  borderColor: ['borderColor'],
  borderCurve: ['borderCurve'],
  borderEndColor: ['borderEndColor'],
  borderEndEndRadius: ['borderEndEndRadius'],
  borderEndStartRadius: ['borderEndStartRadius'],
  borderLeftColor: ['borderLeftColor'],
  borderRadius: ['borderRadius'],
  borderRightColor: ['borderRightColor'],
  borderStartColor: ['borderStartColor'],
  borderStartEndRadius: ['borderStartEndRadius'],
  borderStartStartRadius: ['borderStartStartRadius'],
  borderStyle: ['borderStyle'],
  borderTopColor: ['borderTopColor'],
  borderTopEndRadius: ['borderTopEndRadius'],
  borderTopLeftRadius: ['borderTopLeftRadius'],
  borderTopRightRadius: ['borderTopRightRadius'],
  borderTopStartRadius: ['borderTopStartRadius'],
  opacity: ['opacity'],
  elevation: ['elevation'],
  pointerEvents: ['pointerEvents'],

  // TextStyleIOS
  fontVariant: ['fontVariant'],
  textDecorationColor: ['textDecorationColor'],
  textDecorationStyle: ['textDecorationStyle'],
  writingDirection: ['writingDirection'],

  // TextStyleAndroid
  textAlignVertical: ['textAlignVertical'],
  verticalAlign: ['verticalAlign'],
  includeFontPadding: ['includeFontPadding'],

  // TextStyle
  color: ['color'],
  fontFamily: ['fontFamily'],
  fontSize: ['fontSize'],
  fontStyle: ['fontStyle'],
  fontWeight: ['fontWeight'],
  letterSpacing: ['letterSpacing'],
  lineHeight: ['lineHeight'],
  textAlign: ['textAlign'],
  textDecorationLine: ['textDecorationLine'],
  textShadowColor: ['textShadowColor'],
  textShadowOffset: ['textShadowOffset'],
  textTransform: ['textTransform'],

  // ImageStyle
  resizeMode: ['resizeMode'],
  overlayColor: ['overlayColor'],
  tintColor: ['tintColor'],
  objectFit: ['objectFit'],
}

export const createTheme = <
  T extends Tokens,
  P extends Properties,
  M extends Macros<T>,
  B extends Breakpoints,
>({
  tokens,
  properties: userProperties = {},
  macros: userMacros = {},
  breakpoints: userBreakpoints = {},
}: {
  tokens: T
  properties?: Partial<P>
  macros?: Partial<M>
  breakpoints?: Partial<B>
}): Theme<T, P, M, B> => {
  const properties = Object.assign({}, propertyMapping, userProperties) as P
  const macros = userMacros as M
  const breakpoints = Object.entries(userBreakpoints)
    .sort(([_a, a], [_b, b]) => {
      return a - b
    })
    .reduce((breakpoints, [key, value]) => {
      breakpoints[key as keyof B] = value
      return breakpoints
    }, {} as B)

  type InnerTheme = Theme<
    typeof tokens,
    typeof properties,
    typeof macros,
    typeof breakpoints
  >

  function _applyStyleProperty(styles: StyleObject, prop: string, value: any) {
    for (const _prop of properties[prop]) {
      // @ts-ignore no index sig, it's fine
      const t = specialTokenMapping[_prop]
        ? // @ts-ignore no index sig, it's fine
          tokens[specialTokenMapping[_prop]]
        : tokens[_prop]
      styles[_prop] = t?.[value] || value
    }
  }

  const style: InnerTheme['style'] = (rawProps, activeBreakpoints = []) => {
    let styles: StyleObject = {}
    const props: any = {}

    Object.keys(rawProps).forEach(prop => {
      // @ts-ignore no index sig, it's fine
      const value = rawProps[prop]

      if (value === undefined) return

      if (properties[prop]) {
        _applyStyleProperty(styles, prop, value)
      } else if (macros[prop]) {
        styles = {
          ...styles,
          // @ts-ignore no index sig, it's fine
          ...(rawProps[prop] === true ? macros[prop](value, tokens) : {}),
        }
      } else if (breakpoints[prop]) {
        for (const b of Object.keys(breakpoints)) {
          if (activeBreakpoints.includes(b)) {
            // @ts-ignore no index sig, it's fine
            const breakpointStyles = rawProps[b] || {}
            const r = style(breakpointStyles, activeBreakpoints)
            styles = {...styles, ...r.styles}
          } else {
            // @ts-ignore no index sig, it's fine
            delete rawProps[b]
          }
        }
      } else {
        // @ts-ignore no index sig, it's fine
        props[prop] = value
      }
    })

    return {
      styles: StyleSheet.create({sheet: styles}).sheet,
      props: props,
    }
  }

  function getActiveBreakpoints({width}: {width: number}) {
    const active: (keyof typeof breakpoints)[] = Object.keys(
      breakpoints,
    ).filter(breakpoint => width >= breakpoints[breakpoint])

    return {
      active,
      current: active[active.length - 1],
    }
  }

  return {
    config: {
      tokens,
      properties,
      macros,
      breakpoints,
    },
    style,
    getActiveBreakpoints,
  }
}
