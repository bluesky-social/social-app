import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {useHomeHeaderMode} from '#/view/com/util/MainScrollProvider'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {NewPostsPill} from '#/components/NewPostsPill'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

/**
 * Space between the bottom edge of the header and the pill.
 */
const HEADER_GAP = 16

/*
 * A full-width strip whose top edge sits on the header's bottom edge. It
 * clips, so the pill slides out from behind that edge, and back behind it.
 * The bottom padding keeps the pill's hit slop inside the clip. The strip
 * itself takes no touches. On web the page scrolls with the document, so
 * the strip is fixed to the window, as the header is.
 */
const strip = [
  a.fixed,
  a.overflow_hidden,
  a.z_10,
  {
    top: 0,
    left: 0,
    right: 0,
    paddingTop: HEADER_GAP,
    paddingBottom: HITSLOP_20.bottom,
  },
]

/**
 * The "Refresh" pill on a Notifications tab, beneath the header, centred on
 * the content column. It follows the header as the title hides on scroll,
 * coming to rest under the tab pills that stay. The web header doesn't hide,
 * so there it stays put. Render it in a tab, after its list.
 *
 * Once the list is scrolled down it says "New" with an up arrow instead, as
 * pressing it takes the user back to the top.
 */
export function RefreshPill({
  visible,
  isScrolledDown,
  headerHeight,
  titleHeight,
  onPress,
}: {
  visible: boolean
  /**
   * Whether the list is scrolled down, as it reports with
   * `onScrolledDownChange`.
   */
  isScrolledDown: boolean
  /**
   * The height of the whole header, title and tab pills, with the title
   * shown.
   */
  headerHeight: number
  /**
   * The height of the part of the header that hides on scroll.
   */
  titleHeight: SharedValue<number>
  onPress: () => void
}) {
  const {t: l} = useLingui()
  const mode = useHomeHeaderMode()
  const {top: topInset} = useSafeAreaInsets()
  // As `NotificationsHeader` has it
  const pinnedHeight = IS_LIQUID_GLASS ? topInset : 0
  // Translate only: a transform moves it without a layout pass every frame
  const follow = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: IS_WEB
          ? headerHeight
          : headerHeight + mode.get() * (pinnedHeight - titleHeight.get()),
      },
    ],
  }))

  return (
    <Animated.View pointerEvents="box-none" style={[strip, follow]}>
      <Layout.Center pointerEvents="box-none">
        <NewPostsPill
          testID="notificationsRefreshPill"
          visible={visible}
          variant="new"
          showArrow={isScrolledDown}
          // Without `text`, the pill says "New"
          text={
            isScrolledDown
              ? undefined
              : l({
                  message: 'Refresh',
                  comment:
                    'Pill on the notifications list, shown when there are new notifications to load.',
                })
          }
          label={l`Load new notifications`}
          onPress={onPress}
        />
      </Layout.Center>
    </Animated.View>
  )
}
