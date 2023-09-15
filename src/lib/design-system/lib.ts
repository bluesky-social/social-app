import type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  DimensionValue,
  ViewProps,
  TextProps,
  ImageProps,
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

type Styles<T extends Tokens, P extends Properties, C extends Macros<T>> = {
  [Property in ColorProperties]?: keyof T['color']
} & {
  [Property in DimensionProperties]?: keyof T['space'] | DimensionValue
} & {
  [Property in Exclude<
    StyleObjectProperties,
    ColorProperties | DimensionProperties
  >]?: keyof T[Property] | StyleObject[Property]
} & {
  // this empty P is to avoid circular references back to Properties type
  [Property in keyof P]?: Styles<T, {}, C>[P[Property][0]]
} & {
  [Property in keyof C]?: C[Property] extends (
    value: infer Value,
    tokens: T,
  ) => StyleObject
    ? Value
    : never
}

type ResponsiveStyles<
  B extends Breakpoints,
  S extends Styles<any, any, any>,
> = S & {
  [Breakpoint in keyof B]?: S
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

export const create = <
  T extends Tokens,
  P extends Properties,
  C extends Macros<T>,
  B extends Breakpoints,
>({
  tokens,
  properties: userProperties = {},
  macros: userMacros = {},
  breakpoints: userBreakpoints = {},
}: {
  tokens: T
  properties?: Partial<P>
  macros?: Partial<C>
  breakpoints?: Partial<B>
}) => {
  const properties = Object.assign({}, propertyMapping, userProperties) as P
  const macros = userMacros as C
  const breakpoints = userBreakpoints as B

  const keyofProperties = Object.keys(properties) as (keyof P)[]
  const keyofMacros = Object.keys(macros) as (keyof C)[]
  const keyofBreakpoints = Object.keys(breakpoints) as (keyof B)[]
  const allPropertyKeys = [...keyofProperties, ...keyofMacros]

  type InnerStyles = Styles<typeof tokens, typeof properties, typeof macros>
  type InnerResponsiveStyles = ResponsiveStyles<typeof breakpoints, InnerStyles>

  function pick<Props = Partial<ViewProps & TextProps & ImageProps>>(
    props: InnerResponsiveStyles & Props,
  ) {
    const res = {styles: {}, props: {}} as {
      styles: InnerResponsiveStyles
      props: Props
    }

    for (const prop of Object.keys(props)) {
      const value = props[prop]
      if (value === undefined) continue
      if (allPropertyKeys.includes(prop)) {
        // @ts-ignore no index sig, it's fine
        res.styles[prop] = value
      } else if (keyofBreakpoints.includes(prop)) {
        // @ts-ignore no index sig, it's fine
        res.styles[prop] = value
      } else {
        // @ts-ignore no index sig, it's fine
        res.props[prop] = value
      }
    }

    return res
  }

  function style(styles: InnerStyles): StyleObject {
    const s: StyleObject = {}

    for (const prop of Object.keys(styles)) {
      const value = styles[prop]

      if (value === undefined) continue

      if (keyofProperties.includes(prop)) {
        for (const _prop of properties[prop]) {
          // @ts-ignore no index sig, it's fine
          const t = specialTokenMapping[_prop]
            ? // @ts-ignore no index sig, it's fine
              tokens[specialTokenMapping[_prop]]
            : tokens[_prop]
          s[_prop] = t?.[value] || value
        }
      } else if (keyofMacros.includes(prop)) {
        const property = macros[prop]
        if (property) {
          Object.assign(s, property(value, tokens))
        }
      } else {
        // @ts-ignore no index sig, it's fine
        const t = specialTokenMapping[prop]
          ? // @ts-ignore no index sig, it's fine
            tokens[specialTokenMapping[prop]]
          : // @ts-ignore no index sig, it's fine
            tokens[prop]
        s[prop as StyleObjectProperties] = t?.[value] || value
      }
    }

    return StyleSheet.create({sheet: s}).sheet
  }

  function applyBreakpoints(
    styles: InnerResponsiveStyles,
    bp: (keyof typeof breakpoints)[],
  ) {
    let s = styles

    for (const breakpoint of bp) {
      const o = styles[breakpoint] || {}
      s = {...s, ...o}
    }

    return s
  }

  function getActiveBreakpoints({width}: {width: number}) {
    const active: (keyof typeof breakpoints)[] = []

    for (const breakpoint in breakpoints) {
      if (width >= breakpoints[breakpoint]) {
        active.push(breakpoint)
      }
    }

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
    pick,
    applyBreakpoints,
    getActiveBreakpoints,
  }
}
