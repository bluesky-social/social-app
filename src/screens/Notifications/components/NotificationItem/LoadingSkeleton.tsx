import {
  type DimensionValue,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {SHOW_ROW_BORDERS} from '#/screens/Notifications/rowBorders'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {PostControlsSkeleton} from '#/components/PostControls'
import * as Skele from '#/components/Skeleton'
import * as Item from './Item'

/**
 * A kind of skeleton row, after the notifications it stands in for: `group`
 * for a like or repost from several people, `reaction` for one from a single
 * person or a new post on the Activity tab, `follow`, `reply` (with its
 * "replied to" line), and `mention` for mentions and quotes.
 */
type SkeletonKind = 'group' | 'reaction' | 'follow' | 'reply' | 'mention'

/**
 * A believable stretch of a feed with every kind of notification in it,
 * cycled to fill the screen.
 */
const MIXED_KINDS: SkeletonKind[] = [
  'group',
  'reply',
  'follow',
  'reaction',
  'group',
  'mention',
  'follow',
]

/**
 * The kinds of row each tab's skeleton cycles through, so that it looks like
 * the tab that's loading. The Followers tab is a list of people instead, see
 * `FollowersSkeleton`.
 */
const TAB_KINDS: Record<
  Exclude<GroupedNotificationsFeed, 'followers'>,
  SkeletonKind[]
> = {
  all: MIXED_KINDS,
  'people-i-follow': MIXED_KINDS,
  conversations: ['reply', 'reply', 'mention'],
  activity: ['reaction'],
}

/**
 * Enough rows to fill a tall screen.
 */
const ROW_COUNT = 12

/**
 * Rows on the Followers tab are about half as tall as the others, so it takes
 * more of them to fill the screen.
 */
const FOLLOWER_ROW_COUNT = 20

/**
 * Placeholder rows for a tab of notifications while its first page loads,
 * shaped like the rows that tab usually has. They share the real rows'
 * padding, avatar slot and line heights, so that the loaded rows don't jump
 * when they replace them.
 */
export function LoadingSkeleton({feed}: {feed: GroupedNotificationsFeed}) {
  const t = useTheme()

  if (feed === 'followers') {
    return <FollowersSkeleton />
  }

  const kinds = TAB_KINDS[feed]
  const rows: React.ReactNode[] = []
  /*
   * Each kind alternates between two variants, counting only its own rows, so
   * that no row looks like the last one of its kind.
   */
  const counts = new Map<SkeletonKind, number>()
  for (let i = 0; i < ROW_COUNT; i++) {
    const kind = kinds[i % kinds.length]
    const index = counts.get(kind) ?? 0
    counts.set(kind, index + 1)
    rows.push(
      // Divided like the rows they stand in for
      <View
        key={i}
        style={[
          i > 0 &&
            SHOW_ROW_BORDERS && [a.border_t, t.atoms.border_contrast_low],
        ]}>
        <RowSkeleton kind={kind} index={index} />
      </View>,
    )
  }

  return (
    <>
      <TodayHeaderSkeleton />
      {rows}
    </>
  )
}

/**
 * Stands in for the "Today" section header, as most feeds open with one. It
 * matches the real header's padding and text size, so the rows below don't
 * move when it arrives.
 */
function TodayHeaderSkeleton() {
  const t = useTheme()

  return (
    <View
      style={[
        a.px_lg,
        a.py_sm,
        SHOW_ROW_BORDERS && [a.border_b, t.atoms.border_contrast_low],
      ]}>
      <Skele.Text style={[a.text_md, a.font_bold, {width: 48}]} />
    </View>
  )
}

/**
 * Picks the skeleton row for `kind`.
 */
function RowSkeleton({kind, index}: {kind: SkeletonKind; index: number}) {
  switch (kind) {
    case 'group':
      return <GroupSkeleton index={index} />
    case 'reaction':
      return <ReactionSkeleton index={index} />
    case 'follow':
      return <FollowSkeleton index={index} />
    case 'reply':
      return <PostSkeleton index={index} isReply />
    case 'mention':
      return <PostSkeleton index={index} isReply={false} />
  }
}

/**
 * Stands in for a like or repost from several people: their avatars, the
 * headline, a preview of the post, and the time.
 */
function GroupSkeleton({index}: {index: number}) {
  const even = index % 2 === 0

  return (
    <Row>
      <Item.AvatarSkeleton />
      <Item.Content>
        <AvatarRowSkeleton count={even ? 4 : 2} overflow={even} />
        <Lines style={a.text_md} widths={even ? ['100%', '30%'] : ['85%']} />
        <Lines
          blend
          style={a.text_sm}
          widths={even ? ['90%'] : ['100%', '55%']}
        />
        <TimestampSkeleton />
      </Item.Content>
    </Row>
  )
}

/**
 * Stands in for a like or repost from one person, or a new post on the
 * Activity tab, sometimes of a post with images.
 */
function ReactionSkeleton({index}: {index: number}) {
  const even = index % 2 === 0

  return (
    <Row>
      <Item.AvatarSkeleton />
      <Item.Content>
        <Lines style={a.text_md} widths={[even ? '75%' : '65%']} />
        <Lines
          blend
          style={a.text_sm}
          widths={even ? ['100%', '40%'] : ['80%']}
        />
        <TimestampSkeleton />
      </Item.Content>
      {even && (
        <Item.Trailing>
          <ThumbnailSkeleton />
        </Item.Trailing>
      )}
    </Row>
  )
}

/**
 * Stands in for a single follow: the headline, a short line of who you have
 * in common, the time, and a follow button.
 */
function FollowSkeleton({index}: {index: number}) {
  const even = index % 2 === 0

  return (
    <Row>
      <Item.AvatarSkeleton />
      <Item.Content>
        <Lines style={a.text_md} widths={[even ? '60%' : '50%']} />
        <Lines blend style={a.text_sm} widths={[even ? '45%' : '55%']} />
        <TimestampSkeleton />
      </Item.Content>
      <Item.Trailing>
        <FollowButtonSkeleton />
      </Item.Trailing>
    </Row>
  )
}

/**
 * Stands in for a reply, mention or quote: the author, the post, the time,
 * and the post's actions. Replies also say what they replied to.
 */
function PostSkeleton({index, isReply}: {index: number; isReply: boolean}) {
  const even = index % 2 === 0

  return (
    <Row>
      <Item.AvatarSkeleton />
      <Item.Content style={[a.gap_sm]}>
        <View style={[a.gap_xs]}>
          <Skele.Row style={[a.gap_xs]}>
            <Skele.Text style={[a.text_md, {width: even ? '25%' : '35%'}]} />
            <Skele.Text
              blend
              style={[a.text_md, {width: even ? '35%' : '30%'}]}
            />
          </Skele.Row>
          {isReply && (
            <Lines blend style={a.text_md} widths={[even ? '65%' : '75%']} />
          )}
          <Lines
            blend
            style={a.text_md}
            widths={even ? ['100%', '60%'] : ['80%']}
          />
          <TimestampSkeleton />
        </View>
        {/* Pulled up as `Item.PostActions` is, by the skeleton's padding */}
        <PostControlsSkeleton style={{marginTop: -4}} />
      </Item.Content>
    </Row>
  )
}

/**
 * The Followers tab's skeleton: its header, then a list of people.
 */
function FollowersSkeleton() {
  const {gtMobile} = useBreakpoints()

  return (
    <>
      {/* Matches `FollowedYouHeader` */}
      <View style={[a.px_lg, a.py_md]}>
        <Skele.Text style={[a.text_md, {width: 96}]} />
      </View>
      {Array.from({length: FOLLOWER_ROW_COUNT}, (_, index) => (
        <FollowerSkeleton key={index} index={index} isBadged={gtMobile} />
      ))}
    </>
  )
}

/**
 * Stands in for a `FollowerNotification`: a compact profile row with a
 * follow button.
 */
function FollowerSkeleton({
  index,
  isBadged,
}: {
  index: number
  /**
   * Whether the avatar has room for a badge, which the rows only have on
   * larger screens.
   */
  isBadged: boolean
}) {
  const even = index % 2 === 0

  return (
    <Row style={[a.align_center, a.py_sm]}>
      {isBadged ? (
        <Item.AvatarSkeleton />
      ) : (
        // The same size as `Item.Avatar`, without its slot
        <Skele.Circle size={Item.AVATAR_SIZE} />
      )}
      <Item.Content style={[a.gap_0]}>
        <Lines style={a.text_md} widths={[even ? '40%' : '55%']} />
        <Lines blend style={a.text_sm} widths={[even ? '50%' : '35%']} />
      </Item.Content>
      <Item.Trailing>
        <FollowButtonSkeleton />
      </Item.Trailing>
    </Row>
  )
}

/**
 * Lays a skeleton row out like `Item.Root`, without being pressable.
 */
function Row({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  return (
    <View
      style={[a.flex_row, a.align_start, a.gap_lg, a.px_lg, a.py_md, style]}>
      {children}
    </View>
  )
}

/**
 * Lines of wrapping text, one per width, at the line height of `style`.
 * `blend` makes them fainter, for muted or secondary text.
 */
function Lines({
  widths,
  blend,
  style,
}: {
  widths: DimensionValue[]
  blend?: boolean
  /**
   * The real text's size atom, e.g. `a.text_md`.
   */
  style: StyleProp<TextStyle>
}) {
  return (
    <View>
      {widths.map((width, index) => (
        <Skele.Text key={index} blend={blend} style={[style, {width}]} />
      ))}
    </View>
  )
}

/**
 * Stands in for `Item.Timestamp`, e.g. "7m ago".
 */
function TimestampSkeleton() {
  return <Lines blend style={a.text_sm} widths={[48]} />
}

/**
 * Stands in for `Item.AvatarRow` and its avatars. With `overflow`, a
 * fainter circle at the end stands in for its "+N" chip.
 */
function AvatarRowSkeleton({
  count,
  overflow,
}: {
  count: number
  overflow: boolean
}) {
  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      {Array.from({length: count}, (_, index) => (
        <Skele.Circle key={index} size={Item.PREVIEW_AVATAR_SIZE} />
      ))}
      {overflow && <Skele.Circle blend size={Item.PREVIEW_AVATAR_SIZE} />}
    </View>
  )
}

/**
 * Stands in for a trailing `Item.InlineImages`.
 */
function ThumbnailSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[a.rounded_md, t.atoms.bg_contrast_50, {width: 60, height: 60}]}
    />
  )
}

/**
 * Stands in for `Item.FollowButton`, about as wide as "Follow back", which is
 * what it says for anyone you haven't followed back yet.
 */
function FollowButtonSkeleton() {
  return <Skele.Pill blend size={24} style={{width: 80}} />
}
