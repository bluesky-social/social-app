import '#/components/icons/nanoFont'

import {forwardRef} from 'react'
import {type ColorValue, StyleSheet} from 'react-native'
import {createNanoIconSet} from 'react-native-nano-icons'
import type Svg from 'react-native-svg'

import {useTheme} from '#/alf'
import {type Props, sizes} from '#/components/icons/common'
import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'
import brandsGlyphMap from '../../../assets/nano-icons/nanoicons/icons-brands.glyphmap.json'
import communityGlyphMap from '../../../assets/nano-icons/nanoicons/icons-community.glyphmap.json'
import uiGlyphMap from '../../../assets/nano-icons/nanoicons/icons-ui.glyphmap.json'

/**
 * One font per codegen directory under `assets/icons/`. The fonts are built
 * from those SVGs by the react-native-nano-icons config plugin, see
 * `app.config.js`.
 */
const glyphMaps = {
  ui: uiGlyphMap,
  brands: brandsGlyphMap,
  community: communityGlyphMap,
}

const iconSets = {
  ui: createNanoIconSet(uiGlyphMap),
  brands: createNanoIconSet(brandsGlyphMap),
  community: createNanoIconSet(communityGlyphMap),
}

type GlyphMaps = typeof glyphMaps

export type IconSetName = keyof GlyphMaps

export type IconName<S extends IconSetName> = keyof GlyphMaps[S]['i'] & string

/**
 * Wraps a generated react-native-svg icon so that it renders as a single
 * glyph from the icon font instead of SvgView + Group + Path.
 *
 * The glyph covers the props icons are used with in practice. Anything it
 * cannot reproduce - a `gradient`, a `height` that differs from the width, or
 * any other SVG prop - renders the wrapped SVG icon instead, so the prop
 * contract and the `svgPaths` metadata read by `@bsky.app/peek-menu` stay
 * exactly those of the SVG icon.
 */
export function createNanoIcon<S extends IconSetName>(
  iconSet: S,
  name: IconName<S>,
  SvgIcon: IconWithSvgMeta,
): IconWithSvgMeta {
  /*
   * Each set is typed by its own glyph names, which `name` already narrows
   * to, so widen the component to accept any name.
   */
  const NanoIconSet = iconSets[iconSet] as React.ComponentType<
    Omit<React.ComponentProps<(typeof iconSets)['ui']>, 'name'> & {
      name: string
    }
  >
  const glyph = (glyphMaps[iconSet].i as unknown as Record<string, GlyphEntry>)[
    name
  ]
  const layerColors = glyph[1].map(([, color]) => color)

  const Icon = forwardRef<Svg, Props>(function NanoIcon(props, ref) {
    const t = useTheme()
    const {fill, size, style, width, height, testID, gradient, ...rest} = props

    /*
     * Mirrors useCommonSVGProps: an explicit `size` token wins, then a raw
     * `width`, then the default. `fill` wins over a color inherited via style.
     */
    const resolvedSize = Number(size ? sizes[size] : width || sizes.md)

    if (
      gradient ||
      (height !== undefined && Number(height) !== resolvedSize) ||
      Object.values(rest).some(value => value !== undefined)
    ) {
      return <SvgIcon {...props} ref={ref} />
    }

    const resolvedFill = (fill ||
      StyleSheet.flatten(style)?.color ||
      t.palette.primary_500) as ColorValue

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
         * Brand marks keep their paint roles like `createSVG`: layers painted
         * `currentColor` take the icon fill and the others keep their fixed
         * colour, e.g. the white tick in `VerifiedCheck`. Other icons are
         * filled entirely, as `createSinglePathSVG` ignores the source colour.
         */
        color={
          iconSet === 'brands'
            ? layerColors.map(color =>
                color === 'currentColor' ? resolvedFill : color,
              )
            : resolvedFill
        }
        /*
         * Icons historically accept text styles (to inherit `color`), but the
         * glyph container is a View. Only layout props are meaningful here.
         */
        style={StyleSheet.flatten(style) ?? undefined}
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

/**
 * A glyphmap entry: the advance width and one `[codepoint, color]` pair per
 * colour layer.
 */
type GlyphEntry = [number, [number, string][]]
