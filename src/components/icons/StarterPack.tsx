import {createNanoIcon} from './nano'
import {createMultiPathSVG} from './TEMPLATE'

/**
 * Special icon for large display. Use with `gradient="sky"`. Stays on
 * react-native-svg because font glyphs cannot carry a gradient.
 *
 * If trying to slot into other components (e.g. as a Menu.Item) use StarterPack_Stroke2_Corner0_Rounded instead
 */
export const StarterPackMultiPathLarge = createMultiPathSVG({
  paths: [
    'M11.26 5.227 5.02 6.899c-.734.197-1.17.95-.973 1.685l1.672 6.24c.197.734.951 1.17 1.685.973l6.24-1.672c.734-.197 1.17-.951.973-1.685L12.945 6.2a1.375 1.375 0 0 0-1.685-.973Zm-6.566.459a2.632 2.632 0 0 0-1.86 3.223l1.672 6.24a2.632 2.632 0 0 0 3.223 1.861l6.24-1.672a2.631 2.631 0 0 0 1.861-3.223l-1.672-6.24a2.632 2.632 0 0 0-3.223-1.861l-6.24 1.672Z',
    'M15.138 18.411a4.606 4.606 0 1 0 0-9.211 4.606 4.606 0 0 0 0 9.211Zm0 1.257a5.862 5.862 0 1 0 0-11.724 5.862 5.862 0 0 0 0 11.724Z',
  ],
})

export const StarterPack_Stroke2_Corner0_Rounded = createNanoIcon(
  'StarterPack_Stroke2_Corner0_Rounded',
)
