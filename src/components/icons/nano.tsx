import {type ColorValue, StyleSheet} from 'react-native'
import {createNanoIconSet} from 'react-native-nano-icons'

import {useTheme} from '#/alf'
import {type Props, sizes} from '#/components/icons/common'
import glyphMap from '../../../assets/nano-icons/nanoicons/app-icons.glyphmap.json'

const NanoIcon = createNanoIconSet(glyphMap)

type IconName = keyof (typeof glyphMap)['i']

/**
 * Drop-in replacement for `createSinglePathSVG` backed by a font glyph instead
 * of a react-native-svg subtree. Each icon renders as one native text glyph
 * rather than SvgView + Group + Path, which is three native views per icon.
 *
 * The prop contract deliberately mirrors `useCommonSVGProps` so call sites and
 * wrappers such as `PostControlButtonIcon` do not have to change.
 *
 * Only icons that are a single filled path can move here. Anything using the
 * `gradient` prop (`StarterPackIcon`) or several fill colours (`VerifiedCheck`)
 * must stay on react-native-svg.
 */
export function createNanoIcon(name: IconName) {
  return function Icon({fill, size, style, width, testID}: Props) {
    const t = useTheme()
    const flattened = StyleSheet.flatten(style)

    /*
     * Mirrors useCommonSVGProps: an explicit `size` token wins, then a raw
     * `width`, then the default. `fill` wins over a color inherited via style.
     */
    const resolvedSize = Number(size ? sizes[size] : width || sizes.md)
    const color = (fill || flattened?.color || t.palette.primary_500) as
      ColorValue | ColorValue[]

    return (
      /*
       * The a11y rule wants an accessibilityHint alongside accessibilityLabel,
       * but a hint would be exactly wrong here: the label is empty precisely to
       * remove this glyph from the accessibility tree, and a hint would put
       * content back into it. See the accessibilityLabel comment below.
       */
      // oxlint-disable-next-line react-native-a11y/has-accessibility-hint
      <NanoIcon
        name={name}
        size={resolvedSize}
        color={color}
        style={flattened}
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
}

/* Post action bar */
export const ReplyIcon = createNanoIcon('reply')
export const RepostIcon = createNanoIcon('repost')
export const HeartIcon = createNanoIcon('heart')
export const HeartFilledIcon = createNanoIcon('heart-filled')
export const BookmarkIcon = createNanoIcon('bookmark')
export const BookmarkFilledIcon = createNanoIcon('bookmark-filled')
export const ShareIcon = createNanoIcon('share')
export const MenuIcon = createNanoIcon('menu')

/* Feed rows and post embeds */
export const PinIcon = createNanoIcon('pin')
export const EarthIcon = createNanoIcon('earth')
export const PlayIcon = createNanoIcon('play')
export const PauseIcon = createNanoIcon('pause')
export const MuteIcon = createNanoIcon('mute')
export const UnmuteIcon = createNanoIcon('unmute')
export const ArrowTopRightIcon = createNanoIcon('arrow-top-right')
export const ClockIcon = createNanoIcon('clock')

/* Feed loading skeletons - 8 rows x 3 icons per placeholder, one per profile tab */
export const BubbleIcon = createNanoIcon('bubble')
export const RepostCorner2Icon = createNanoIcon('repost-corner2')

/* Shell chrome, mounted for the whole session */
export const HomeIcon = createNanoIcon('home')
export const HomeFilledIcon = createNanoIcon('home-filled')
export const SearchIcon = createNanoIcon('search')
export const SearchFilledIcon = createNanoIcon('search-filled')
export const MessageIcon = createNanoIcon('message')
export const MessageFilledIcon = createNanoIcon('message-filled')
export const BellIcon = createNanoIcon('bell')
export const BellFilledIcon = createNanoIcon('bell-filled')
export const InboxIcon = createNanoIcon('inbox')
export const CircleCheckIcon = createNanoIcon('circle-check')
