import '#/components/icons/nanoFont'

import {
  type ColorValue,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import {createNanoIconSet} from 'react-native-nano-icons'

import {useTheme} from '#/alf'
import {type Props, sizes} from '#/components/icons/common'
import glyphMap from '../../../assets/nano-icons/nanoicons/app-icons.glyphmap.json'

const NanoIconSet = createNanoIconSet(glyphMap)

export type IconName = keyof (typeof glyphMap)['i']

type NanoIconComponent = (props: Props) => React.ReactNode

/**
 * Path data consumed by natively drawn menus, see `@bsky.app/peek-menu`.
 */
type SvgIconMeta = {
  svgPaths: string[]
  svgViewBox: string
  svgStrokeWidth: number
}

/**
 * Renders one glyph from the app icon font with the accessibility and font
 * scaling behaviour of the react-native-svg icons it replaced. `size` is the
 * glyph height in points; the width follows the glyph's advance.
 */
export function NanoGlyph({
  name,
  size,
  color,
  style,
  testID,
}: {
  name: IconName
  size: number
  color: ColorValue | ColorValue[]
  style?: StyleProp<ViewStyle | TextStyle>
  testID?: string
}) {
  return (
    /*
     * The a11y rule wants an accessibilityHint alongside accessibilityLabel,
     * but a hint would be exactly wrong here: the label is empty precisely to
     * remove this glyph from the accessibility tree, and a hint would put
     * content back into it. See the accessibilityLabel comment below.
     */
    // oxlint-disable-next-line react-native-a11y/has-accessibility-hint
    <NanoIconSet
      name={name}
      size={size}
      color={color}
      /*
       * Icons historically accept text styles (to inherit `color`), but the
       * glyph container is a View. Only layout props are meaningful here.
       */
      style={StyleSheet.flatten(style) ?? undefined}
      testID={testID}
      /*
       * The SVG icons these replace are sized in raw points and never scaled
       * with the system font setting, so opt out to keep layout identical.
       */
      allowFontScaling={false}
      /*
       * Also matches the SVG icons: these sit inside buttons that carry their
       * own label, so the glyph itself must stay invisible to screen readers.
       *
       * The empty label is load-bearing. Nano Icons falls back to
       * `accessibilityLabel ?? name`, so without it every glyph is announced
       * by its icon name on top of the button's own label ("Reply, button"
       * then "reply, image"). `importantForAccessibility` alone does not
       * suppress it - the native view still exposes a contentDescription.
       */
      accessibilityLabel=""
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}

/**
 * Creates a font-glyph icon component. Each icon renders as one
 * native view instead of SvgView + Group + Path.
 *
 * The prop contract mirrors `useCommonSVGProps` so call sites do not change.
 * The `gradient` prop is not supported - icons that need it (`StarterPack`)
 * stay on react-native-svg.
 *
 * Glyph sources live in `assets/nano-icons/app-icons/<name>.svg` and are
 * compiled into the font by the react-native-nano-icons config plugin.
 */
export function createNanoIcon(
  name: IconName,
  options: {svgPath: string; layers?: (fill: ColorValue) => ColorValue[]},
): NanoIconComponent & SvgIconMeta
export function createNanoIcon(
  name: IconName,
  options?: {layers?: (fill: ColorValue) => ColorValue[]},
): NanoIconComponent
export function createNanoIcon(
  name: IconName,
  {
    layers,
    svgPath,
  }: {
    /**
     * Maps the resolved fill to one colour per glyph layer, for icons with
     * fixed accent colours such as the white tick in `VerifiedCheck`.
     */
    layers?: (fill: ColorValue) => ColorValue[]
    /**
     * The 24x24 SVG path, for icons that are also drawn natively from path
     * data (`PeekMenu.MenuItemIcon` takes an `SvgIconMeta`).
     */
    svgPath?: string
  } = {},
): NanoIconComponent | (NanoIconComponent & SvgIconMeta) {
  function Icon({fill, size, style, width, testID}: Props) {
    const t = useTheme()

    /*
     * Mirrors useCommonSVGProps: an explicit `size` token wins, then a raw
     * `width`, then the default. `fill` wins over a color inherited via style.
     */
    const resolvedSize = Number(size ? sizes[size] : width || sizes.md)
    const resolvedFill = (fill ||
      StyleSheet.flatten(style)?.color ||
      t.palette.primary_500) as ColorValue

    return (
      <NanoGlyph
        name={name}
        size={resolvedSize}
        color={layers ? layers(resolvedFill) : resolvedFill}
        style={style}
        testID={testID}
      />
    )
  }

  return svgPath
    ? Object.assign(Icon, {
        svgPaths: [svgPath],
        svgViewBox: '0 0 24 24',
        svgStrokeWidth: 0,
      })
    : Icon
}

/*
 * Short aliases used by the feed and tab bar. Prefer importing the canonical
 * export from the icon's own module.
 */

/* Post action bar */
export const ReplyIcon = createNanoIcon('Reply')
export const RepostIcon = createNanoIcon('Repost_Stroke2_Corner3_Rounded')
export const HeartIcon = createNanoIcon('Heart2_Stroke2_Corner0_Rounded')
export const HeartFilledIcon = createNanoIcon(
  'Heart2_Filled_Stroke2_Corner0_Rounded',
)
export const BookmarkIcon = createNanoIcon('Bookmark')
export const BookmarkFilledIcon = createNanoIcon('BookmarkFilled')
export const ShareIcon = createNanoIcon(
  'ArrowShareRight_Stroke2_Corner2_Rounded',
)
export const MenuIcon = createNanoIcon('DotGrid3x1_Stroke2_Corner0_Rounded')

/* Feed rows and post embeds */
export const PinIcon = createNanoIcon('Pin_Stroke2_Corner0_Rounded')
export const EarthIcon = createNanoIcon('Earth_Stroke2_Corner0_Rounded')
export const PlayIcon = createNanoIcon('Play_Filled_Corner0_Rounded')
export const PauseIcon = createNanoIcon('Pause_Filled_Corner0_Rounded')
export const MuteIcon = createNanoIcon('Mute_Stroke2_Corner0_Rounded')
export const UnmuteIcon = createNanoIcon(
  'SpeakerVolumeFull_Stroke2_Corner0_Rounded',
)
export const ArrowTopRightIcon = createNanoIcon(
  'ArrowTopRight_Stroke2_Corner0_Rounded',
)
export const ClockIcon = createNanoIcon('Clock_Stroke2_Corner0_Rounded')

/* Feed loading skeletons */
export const BubbleIcon = createNanoIcon('Bubble_Stroke2_Corner2_Rounded')
export const RepostCorner2Icon = createNanoIcon(
  'Repost_Stroke2_Corner2_Rounded',
)

/* Shell chrome */
export const HomeIcon = createNanoIcon('HomeOpen_Stoke2_Corner0_Rounded')
export const HomeFilledIcon = createNanoIcon('HomeOpen_Filled_Corner0_Rounded')
export const SearchIcon = createNanoIcon(
  'MagnifyingGlass_Stroke2_Corner0_Rounded',
)
export const SearchFilledIcon = createNanoIcon(
  'MagnifyingGlass_Filled_Stroke2_Corner0_Rounded',
)
export const MessageIcon = createNanoIcon('Message_Stroke2_Corner0_Rounded')
export const MessageFilledIcon = createNanoIcon(
  'Message_Stroke2_Corner0_Rounded_Filled',
)
export const BellIcon = createNanoIcon('Bell_Stroke2_Corner0_Rounded')
export const BellFilledIcon = createNanoIcon('Bell_Filled_Corner0_Rounded')
export const InboxIcon = createNanoIcon('Inbox_Stroke2_Corner2_Rounded')
export const CircleCheckIcon = createNanoIcon(
  'CircleCheck_Stroke2_Corner0_Rounded',
)
