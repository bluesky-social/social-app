import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Skele from '#/components/Skeleton'

/**
 * Enough cards to fill a tall screen.
 */
const CARD_COUNT = 10

/**
 * The size of the avatar in `FeedSourceCard`.
 */
const AVATAR_SIZE = 36

/**
 * Placeholder cards for a list of feeds or lists while it loads.
 */
export function FeedCardListSkeleton() {
  return (
    <>
      {Array.from({length: CARD_COUNT}, (_, index) => (
        <FeedCardSkeleton key={index} index={index} />
      ))}
    </>
  )
}

/**
 * Stands in for a `FeedSourceCard`: the avatar, the name and who made it, and
 * its description. They share the real card's padding, so that the loaded
 * card doesn't jump when it replaces this.
 */
export function FeedCardSkeleton({
  index = 0,
  style,
  showDescription = true,
  showTopBorder = true,
}: {
  /**
   * Varies the widths of the lines, so that a list of these doesn't look like
   * a column of copies.
   */
  index?: number
  style?: StyleProp<ViewStyle>
  showDescription?: boolean
  showTopBorder?: boolean
}) {
  const t = useTheme()
  const even = index % 2 === 0

  return (
    <View
      style={[
        a.p_lg,
        a.gap_md,
        showTopBorder && [a.border_t, t.atoms.border_contrast_low],
        style,
      ]}>
      <Skele.Row style={[a.align_center, a.gap_md]}>
        {/* A rounded square, like the real `algo` avatar */}
        <Skele.Block
          style={[a.rounded_sm, {width: AVATAR_SIZE, height: AVATAR_SIZE}]}
        />
        <Skele.Col>
          <Skele.Text
            style={[a.text_sm, a.font_semi_bold, {width: even ? '45%' : '55%'}]}
          />
          <Skele.Text
            blend
            style={[a.text_sm, {width: even ? '35%' : '30%'}]}
          />
        </Skele.Col>
      </Skele.Row>
      {showDescription && (
        <Skele.Col>
          <Skele.Text blend style={[a.text_sm, {width: '100%'}]} />
          <Skele.Text
            blend
            style={[a.text_sm, {width: even ? '60%' : '80%'}]}
          />
        </Skele.Col>
      )}
    </View>
  )
}
