import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {type ResizeMode, type ResizeScope} from './config'
import {type LabRow} from './data'
import {type Probe} from './probe'

/** Where a late-resizing row starts before it settles at its real height. */
function placeholderHeight(height: number, mode: ResizeMode) {
  if (mode === 'shrink') return Math.max(height * 2, height + 150)
  if (mode === 'grow') return Math.max(40, Math.round(height * 0.4))
  return height
}

/**
 * One synthetic row. Memoized on its (stable) row object so a prepend only
 * renders the new rows, like PostFeed's items. The anchor highlight comes from
 * the probe's store, so picking an anchor re-renders two rows, not the list.
 */
export const Row = memo(function Row({
  row,
  probe,
  generation,
  resize,
  resizeScope,
  resizeDelayMs,
}: {
  row: LabRow
  probe: Probe
  generation: number
  resize: ResizeMode
  resizeScope: ResizeScope
  resizeDelayMs: number
}) {
  const t = useTheme()
  const ref = useRef<React.ComponentRef<typeof View>>(null)
  const resizes =
    resize !== 'off' &&
    row.kind === 'content' &&
    (resizeScope === 'all' || row.batch > 0)
  // Once per row: a remount after virtualization renders the final height.
  const [height, setHeight] = useState(() =>
    resizes && !probe.hasResized(row.id)
      ? placeholderHeight(row.height, resize)
      : row.height,
  )
  const isAnchor = useSyncExternalStore(
    probe.subscribeAnchor,
    () => probe.anchorId === row.id,
  )

  useLayoutEffect(() => {
    probe.mountRow(generation, row.id, row.kind, ref)
    return () => probe.unmountRow(generation, row.id)
  }, [probe, generation, row.id, row.kind])

  useEffect(() => {
    if (height === row.height) return
    const timer = setTimeout(() => {
      probe.markResized(generation, row.id)
      setHeight(row.height)
    }, resizeDelayMs)
    return () => clearTimeout(timer)
  }, [probe, generation, row.id, row.height, height, resizeDelayMs])

  if (row.kind === 'leading') {
    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          a.justify_center,
          a.px_lg,
          a.border_b,
          t.atoms.border_contrast_low,
          t.atoms.bg_contrast_50,
          {height},
        ]}>
        <Text style={[a.text_sm, a.font_bold]}>Leading row (not content)</Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          Like PostFeed’s composer prompt · {row.id}
        </Text>
      </View>
    )
  }

  const stripe =
    row.batch === 0
      ? t.palette.contrast_200
      : row.batch % 2 === 1
        ? t.palette.primary_500
        : t.palette.positive_500

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        a.flex_row,
        a.overflow_hidden,
        a.border_b,
        t.atoms.border_contrast_low,
        isAnchor ? {backgroundColor: t.palette.primary_50} : t.atoms.bg,
        {height},
      ]}>
      <View style={[{width: 6, backgroundColor: stripe}]} />
      <View style={[a.flex_1, a.px_md, a.py_sm, a.gap_2xs]}>
        <Text style={[a.text_md, a.font_bold]}>
          Post {row.seq}
          {isAnchor ? ' · tracked anchor' : ''}
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {row.batch === 0 ? 'initial' : `prepend ${row.batch}`} · {row.height}
          pt
          {height !== row.height ? ` · ${height}pt until it resizes` : ''}
        </Text>
      </View>
    </View>
  )
})

/** A `ListHeaderComponent`, which VirtualizedList skips natively on its own. */
export function ListHeader() {
  const t = useTheme()
  return (
    <View
      style={[
        a.justify_center,
        a.px_lg,
        a.border_b,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_100,
        {height: 120},
      ]}>
      <Text style={[a.text_sm, a.font_bold]}>ListHeaderComponent</Text>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
        Not in data: VirtualizedList adds 1 to the native minIndexForVisible
      </Text>
    </View>
  )
}
