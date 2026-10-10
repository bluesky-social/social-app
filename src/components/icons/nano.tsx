import {forwardRef} from 'react'
import {
  type ColorValue,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import {createNanoIconSet} from 'react-native-nano-icons'
import type Svg from 'react-native-svg'

import {useTheme} from '#/alf'
import {type Props, sizes} from '#/components/icons/common'
import {
  glyphMaps,
  type IconSet,
  type NanoGlyphName,
} from '#/components/icons/glyphMaps'
import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'
/*
 * Each set is typed by its own glyph names, so widen the components to accept
 * any name. The native renderers put `style` in an array, so a style array is
 * fine too.
 */
const iconSets = {
  ui: createNanoIconSet(glyphMaps.ui),
  brands: createNanoIconSet(glyphMaps.brands),
  community: createNanoIconSet(glyphMaps.community),
} as unknown as Record<
  IconSet,
  React.ComponentType<
    Omit<
      React.ComponentProps<ReturnType<typeof createNanoIconSet>>,
      'name' | 'style'
    > & {
      name: string
      style?: StyleProp<ViewStyle>
    }
  >
>

/**
 * A glyphmap entry: the advance width and one `[codepoint, color]` pair per
 * colour layer.
 */
type GlyphEntry = [number, [number, string][]]

const reportedFallbacks = new Set<string>()

/**
 * Falling back to SVG for a prop the glyph does not support is correct, but
 * silently gives up the glyph's performance. Say so once per icon and prop.
 */
function warnFallback(name: string, prop: string) {
  const key = `${name}:${prop}`
  if (reportedFallbacks.has(key)) return
  reportedFallbacks.add(key)
  console.warn(
    `${name} renders with react-native-svg instead of its font glyph because of the \`${prop}\` prop. ` +
      'Avoid this prop on icons, or extend `withNanoGlyph` to support it.',
  )
}

/**
 * Lets a TEMPLATE factory render its icon as a single glyph from the icon
 * font instead of SvgView + Group + Path. Codegen passes the glyph for icons
 * whose glyph matches the SVG icon; without one, the SVG icon is returned
 * unchanged.
 *
 * The glyph covers the props icons are used with in practice. Anything it
 * cannot reproduce - a `gradient`, a `height` that differs from the width, or
 * any other SVG prop - renders the SVG icon instead, so the prop contract and
 * the `svgPaths` metadata read by `@bsky.app/peek-menu` stay exactly those of
 * the SVG icon.
 */
export function withNanoGlyph(
  SvgIcon: IconWithSvgMeta,
  {
    glyph: name,
    layered,
  }: {
    glyph: NanoGlyphName | undefined
    /**
     * Whether the icon keeps the paint roles of its SVG elements, like
     * `createSVG`, instead of being filled entirely like
     * `createSinglePathSVG`.
     */
    layered: boolean
  },
): IconWithSvgMeta {
  if (!name) return SvgIcon

  const iconSet = (Object.keys(glyphMaps) as IconSet[]).find(
    set => name in glyphMaps[set].i,
  )!
  const NanoIconSet = iconSets[iconSet]
  const glyphMap = glyphMaps[iconSet].i as unknown as Record<string, GlyphEntry>
  const layers = glyphMap[name][1].map(([, color]) => color)

  const Icon = forwardRef<Svg, Props>(function NanoIcon(props, ref) {
    const t = useTheme()
    const {fill, size, style, width, height, testID, gradient, ...rest} = props

    /*
     * Mirrors useCommonSVGProps: an explicit `size` token wins, then a raw
     * `width`, then the default. `fill` wins over a color inherited via style.
     */
    const resolvedSize = Number(size ? sizes[size] : width || sizes.md)

    if (gradient) {
      return <SvgIcon {...props} ref={ref} />
    }
    const unsupported =
      height !== undefined && Number(height) !== resolvedSize
        ? 'height'
        : Object.keys(rest).find(
            key => rest[key as keyof typeof rest] !== undefined,
          )
    if (unsupported) {
      if (__DEV__) warnFallback(name, unsupported)
      return <SvgIcon {...props} ref={ref} />
    }

    const resolvedFill = (fill ||
      StyleSheet.flatten(style)?.color ||
      t.palette.primary_500) as ColorValue

    /*
     * Icons historically accept text styles (to inherit `color`), but the
     * glyph container is a View. Only layout props are meaningful here.
     */
    const viewStyle = style as StyleProp<ViewStyle>

    return (
      /*
       * The a11y rule wants an accessibilityHint alongside accessibilityLabel,
       * but a hint would be exactly wrong here: the label is empty precisely
       * to remove this glyph from the accessibility tree, and a hint would
       * put content back into it. See the accessibilityLabel comment below.
       */
      // oxlint-disable-next-line react-native-a11y/has-accessibility-hint
      <NanoIconSet
        name={name}
        size={resolvedSize}
        /*
         * Layered icons keep their paint roles: layers painted `currentColor`
         * take the icon fill and the others keep their fixed colour, e.g. the
         * white tick in `VerifiedCheck`. Other icons are filled entirely, as
         * `createSinglePathSVG` ignores the source colour.
         */
        color={
          layered
            ? layers.map(color =>
                color === 'currentColor' ? resolvedFill : color,
              )
            : resolvedFill
        }
        /*
         * Passed through unflattened, so that a stable style keeps nano's
         * memo comparator effective.
         */
        style={viewStyle}
        testID={testID}
        /*
         * The SVG icons are sized in raw points and never scaled with the
         * system font setting, so opt out to keep layout identical.
         */
        allowFontScaling={false}
        /*
         * Also matches the SVG icons: these sit inside buttons that carry
         * their own label, so the glyph itself must stay invisible to screen
         * readers.
         *
         * The empty label is load-bearing. Nano Icons falls back to
         * `accessibilityLabel ?? name`, so without it every glyph is
         * announced by its icon name on top of the button's own label
         * ("Reply, button" then "reply, image"). `importantForAccessibility`
         * alone does not suppress it - the native view still exposes a
         * contentDescription.
         */
        accessibilityLabel=""
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    )
  }) as IconWithSvgMeta

  Icon.svgPaths = SvgIcon.svgPaths
  Icon.svgViewBox = SvgIcon.svgViewBox
  Icon.svgStrokeWidth = SvgIcon.svgStrokeWidth
  return Icon
}
