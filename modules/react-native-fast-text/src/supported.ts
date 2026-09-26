import {type TextProps, type TextStyle} from 'react-native'

/* Positive lists make new RN props safe by default as RN's API grows. */
const props = new Set([
  'children',
  'style',
  'numberOfLines',
  'ellipsizeMode',
  'allowFontScaling',
  'maxFontSizeMultiplier',
  'lineBreakStrategyIOS',
  'textBreakStrategy',
  'android_hyphenationFrequency',
  'onLayout',
  'testID',
  'nativeID',
  'id',
  'accessible',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessibilityState',
  'accessibilityValue',
  'accessibilityActions',
  'onAccessibilityAction',
  'onAccessibilityTap',
  'onMagicTap',
  'onAccessibilityEscape',
  'accessibilityElementsHidden',
  'accessibilityViewIsModal',
  'accessibilityIgnoresInvertColors',
  'accessibilityLanguage',
  'accessibilityLiveRegion',
  'importantForAccessibility',
])
const disabledProps = new Set(['selectable', 'adjustsFontSizeToFit'])

/** Unsupported behavior is delegated; it is never silently discarded. */
export function supportsProps(value: TextProps, ignored: ReadonlySet<string>) {
  for (const key in value) {
    const entry = value[key as keyof TextProps]
    if (entry == null || props.has(key) || ignored.has(key)) continue
    if (entry === false && disabledProps.has(key)) continue
    return false
  }
  return true
}

const styles = new Set([
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'fontVariant',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'writingDirection',
  'textDecorationLine',
  'includeFontPadding',
  'textShadowColor',
  'textShadowOffset',
  'textShadowRadius',
  'textTransform',
  'alignContent',
  'alignItems',
  'alignSelf',
  'aspectRatio',
  'backgroundColor',
  'backfaceVisibility',
  'borderBottomColor',
  'borderBottomEndRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomStartRadius',
  'borderBottomWidth',
  'borderColor',
  'borderEndColor',
  'borderEndWidth',
  'borderLeftColor',
  'borderLeftWidth',
  'borderRadius',
  'borderRightColor',
  'borderRightWidth',
  'borderStartColor',
  'borderStartWidth',
  'borderStyle',
  'borderTopColor',
  'borderTopEndRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopStartRadius',
  'borderTopWidth',
  'borderWidth',
  'bottom',
  'direction',
  'display',
  'elevation',
  'end',
  'flex',
  'flexBasis',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexWrap',
  'gap',
  'rowGap',
  'columnGap',
  'height',
  'justifyContent',
  'left',
  'margin',
  'marginBottom',
  'marginEnd',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'opacity',
  'overflow',
  'padding',
  'paddingBottom',
  'paddingEnd',
  'paddingHorizontal',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingTop',
  'paddingVertical',
  'position',
  'right',
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'start',
  'top',
  'transform',
  'transformOrigin',
  'width',
  'zIndex',
])

/** Excludes styles whose UILabel/TextView semantics differ from RN Text. */
export function supportsStyle(value: TextStyle | undefined) {
  if (!value) return true
  for (const key in value) {
    if (value[key as keyof TextStyle] != null && !styles.has(key)) return false
  }
  // RN iOS lowercases the remainder of words; the backend follows CSS instead.
  if (value.textTransform === 'capitalize') return false
  if (
    value.fontWeight != null &&
    !/^(normal|bold|[1-9]00)$/.test(String(value.fontWeight))
  ) {
    return false
  }
  return true
}
