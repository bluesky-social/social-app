import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {PostControlsSkeleton} from '#/components/PostControls'
import * as Skele from '#/components/Skeleton'

/**
 * Enough rows to fill a tall screen.
 */
const ROW_COUNT = 10

/**
 * The size of the avatar in `PostFeedItem`.
 */
const AVATAR_SIZE = 42

/**
 * The shapes of post a feed has in it, cycled through so that no row looks
 * like the one above it.
 */
const VARIANTS: {
  name: `${number}%`
  handle: `${number}%`
  lines: `${number}%`[]
  hasImage?: boolean
}[] = [
  {name: '25%', handle: '30%', lines: ['100%', '100%', '55%']},
  {name: '35%', handle: '25%', lines: ['90%', '45%'], hasImage: true},
  {name: '20%', handle: '35%', lines: ['70%']},
  {name: '30%', handle: '30%', lines: ['100%', '75%']},
]

/**
 * Placeholder rows for a feed of posts while its first page loads. They share
 * the real rows' padding, avatar and line heights, so that the loaded posts
 * don't jump when they replace them.
 */
export function PostFeedSkeleton() {
  return (
    <>
      {Array.from({length: ROW_COUNT}, (_, index) => (
        <PostSkeleton key={index} index={index} />
      ))}
    </>
  )
}

/**
 * Stands in for a `PostFeedItem`: the author, the post, sometimes with an
 * image, and the post's controls.
 */
function PostSkeleton({index}: {index: number}) {
  const t = useTheme()
  const {name, handle, lines, hasImage} = VARIANTS[index % VARIANTS.length]

  return (
    <View
      style={[
        a.border_t,
        a.pt_sm,
        a.pb_sm,
        t.atoms.border_contrast_low,
        // Matches the padding of `PostFeedItem`
        {paddingLeft: 18, paddingRight: 15},
      ]}>
      <Skele.Row style={[a.align_start, {gap: 10}]}>
        <Skele.Circle size={AVATAR_SIZE} />

        <Skele.Col style={[a.gap_xs]}>
          <Skele.Row style={[a.gap_sm]}>
            <Skele.Text style={[a.text_md, {width: name}]} />
            <Skele.Text blend style={[a.text_md, {width: handle}]} />
          </Skele.Row>

          <Skele.Col>
            {lines.map((width, i) => (
              <Skele.Text key={i} blend style={[a.text_md, {width}]} />
            ))}
          </Skele.Col>

          {hasImage && (
            <Skele.Block
              blend
              style={[a.mt_xs, a.w_full, {aspectRatio: 16 / 9}]}
            />
          )}

          <PostControlsSkeleton />
        </Skele.Col>
      </Skele.Row>
    </View>
  )
}
