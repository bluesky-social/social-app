import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as Skele from '#/components/Skeleton'

/**
 * Enough rows to fill a tall screen.
 */
const ROW_COUNT = 12

/**
 * The size of the avatar in `ChatListItem`.
 */
const AVATAR_SIZE = 52

/**
 * The shapes of conversation a chat list has in it, cycled through so that no
 * row looks like the one above it.
 */
const VARIANTS: {
  name: `${number}%`
  handle: `${number}%`
  lines: `${number}%`[]
}[] = [
  {name: '35%', handle: '30%', lines: ['90%', '50%']},
  {name: '45%', handle: '35%', lines: ['65%']},
  {name: '30%', handle: '40%', lines: ['100%', '70%']},
  {name: '40%', handle: '25%', lines: ['80%']},
]

/**
 * Placeholder rows for the list of conversations while it loads. They share
 * the real rows' padding, avatar and line heights, so that the loaded
 * conversations don't jump when they replace them.
 */
export function ChatListSkeleton() {
  return (
    <>
      {Array.from({length: ROW_COUNT}, (_, index) => (
        <ChatItemSkeleton key={index} index={index} />
      ))}
    </>
  )
}

/**
 * Stands in for a `ChatListItem`: the person, when they last wrote, their
 * handle, and a preview of the last message.
 */
function ChatItemSkeleton({index}: {index: number}) {
  const {name, handle, lines} = VARIANTS[index % VARIANTS.length]

  return (
    <View style={[a.flex_row, a.align_start, a.gap_md, a.px_lg, a.py_md]}>
      <Skele.Circle size={AVATAR_SIZE} />

      <Skele.Col style={[a.justify_center]}>
        <Skele.Row style={[a.align_center, a.gap_sm, a.pb_2xs]}>
          <Skele.Text style={[a.text_md, a.font_semi_bold, {width: name}]} />
          <Skele.Text blend style={[a.text_sm, {width: 28}]} />
        </Skele.Row>

        <View style={[a.pb_xs]}>
          <Skele.Text blend style={[a.text_sm, {width: handle}]} />
        </View>

        <Skele.Col>
          {lines.map((width, i) => (
            <Skele.Text key={i} blend style={[a.text_md, {width}]} />
          ))}
        </Skele.Col>
      </Skele.Col>
    </View>
  )
}
