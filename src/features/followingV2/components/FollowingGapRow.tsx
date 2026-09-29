import {useRef, useState} from 'react'
import {View} from 'react-native'

import {type FollowingGapOutcome} from '#/state/queries/post-feed'
import {type PageGap} from '#/state/queries/post-feed-boundary'
import {FeedGap} from '#/components/feeds/FeedGap'
import {
  type GapRowStatus,
  gapRowStatusAfterFill,
  isGapRowInView,
} from '#/features/followingV2/feedGapRows'

type ViewRef = React.ComponentRef<typeof View>
type WindowRect = {y: number; height: number}

/**
 * The row at a gap in restored Following, open or filled, which keeps the
 * state of its own press: loading from the press until the gap is filled and
 * the row empties, or ready to press again if the fill failed or wrote nothing
 * (see `gapRowStatusAfterFill`).
 *
 * The fill only lands while the row is in view (see `isGapRowInView`). If the
 * reader has scrolled on into the posts below it by the time the posts that
 * fill it arrive, they are thrown away: the posts being read stay, and the
 * row is there to press again.
 */
export function FollowingGapRow({
  gap,
  onFill,
  listRef,
  headerOffset,
  hideTopBorder,
}: {
  gap: PageGap
  onFill: (
    gap: PageGap,
    options: {mayCommit: () => Promise<boolean>},
  ) => Promise<FollowingGapOutcome>
  /** The view the list fills, to tell where its top is. */
  listRef: React.RefObject<ViewRef | null>
  headerOffset: number
  hideTopBorder: boolean
}) {
  const rowRef = useRef<ViewRef>(null)
  const [status, setStatus] = useState<GapRowStatus>('idle')

  const onPress = async () => {
    if (status === 'filling') return
    setStatus('filling')
    const pressed = measureInWindow(rowRef.current)
    const outcome = await onFill(gap, {
      mayCommit: async () => {
        const [row, list, pressedRow] = await Promise.all([
          measureInWindow(rowRef.current),
          measureInWindow(listRef.current),
          pressed,
        ])
        return isGapRowInView({
          row,
          listTop: list?.y,
          headerOffset,
          pressedTop: pressedRow?.y,
        })
      },
    })
    setStatus(gapRowStatusAfterFill(outcome))
  }

  return (
    /*
     * One host view for the row in both states, which is never flattened
     * away, as VirtualizedList.js does for its header with
     * `collapsable={false}`. The list may be anchored on it when the gap is
     * filled, and a filled gap keeps it, empty, so the native view stays. Were
     * it to go, iOS could reuse that native view for a new one in the same
     * commit, and `maintainVisibleContentPosition` would take the new view's
     * frame for the anchor's and jump. It also keeps this row one subview of
     * the list, as `minIndexForVisible` counts them.
     */
    <View ref={rowRef} collapsable={false}>
      {gap.status === 'open' && (
        <FeedGap
          onPress={() => void onPress()}
          isLoading={status === 'filling'}
          hasFailed={status === 'failed'}
          hideTopBorder={hideTopBorder}
        />
      )}
    </View>
  )
}

/**
 * Where a view is on screen, or `undefined` if it is not mounted or does not
 * say in time.
 */
function measureInWindow(
  view: ViewRef | null,
): Promise<WindowRect | undefined> {
  return new Promise(resolve => {
    if (!view) {
      resolve(undefined)
      return
    }
    const timeout = setTimeout(() => resolve(undefined), 500)
    view.measureInWindow((_x, y, _width, height) => {
      clearTimeout(timeout)
      resolve({y, height})
    })
  })
}
