import {IS_IOS} from '#/env'
import {type HeightProfile} from './data'

export type Trigger = 'now' | 'delay' | 'drag' | 'release' | 'top' | 'repeat'
/** Triggers that wait for a scroll gesture rather than a timer. */
export type GestureTrigger = 'drag' | 'release' | 'top'
export type ResizeMode = 'off' | 'shrink' | 'grow'
export type ResizeScope = 'prepended' | 'all'
/**
 * Which row the lab tracks. `fullyVisible` is the reader's view of "the post
 * I'm looking at"; `topEdge` is the row the viewport's top edge cuts through,
 * which is the one native mVCP picks when nothing above it is on screen.
 */
export type AnchorRule = 'fullyVisible' | 'topEdge'

export type LabConfig = {
  seed: number
  initialRows: number
  /** Non-content rows at the top of `data`, like PostFeed's composer prompt. */
  leadingRows: number
  minIndexForVisible: number
  /** A `ListHeaderComponent`, which VirtualizedList skips natively by itself. */
  listHeader: boolean
  removeClippedSubviews: boolean
  windowSize: number
  initialNumToRender: number | 'feed'
  maxToRenderPerBatch: number | 'feed'
  /** Rows mount at a placeholder height and resize after `resizeDelayMs`, once per row. */
  resize: ResizeMode
  resizeScope: ResizeScope
  resizeDelayMs: number
  prependCount: number
  prependHeights: HeightProfile
  delayMs: number
  repeatCount: number
  repeatIntervalMs: number
  /** Queue VirtualizedList's cells update in the same tick as the prepend. */
  queueCellsUpdate: boolean
  anchorRule: AnchorRule
}

/** PostFeed's list props, so the default is the feed's configuration. */
export const DEFAULT_CONFIG: LabConfig = {
  seed: 1,
  initialRows: 200,
  leadingRows: 0,
  minIndexForVisible: 0,
  listHeader: false,
  removeClippedSubviews: true,
  windowSize: 9,
  initialNumToRender: 'feed',
  maxToRenderPerBatch: 'feed',
  resize: 'off',
  resizeScope: 'prepended',
  resizeDelayMs: 500,
  prependCount: 10,
  prependHeights: 'mixed',
  delayMs: 2000,
  repeatCount: 3,
  repeatIntervalMs: 1000,
  queueCellsUpdate: false,
  anchorRule: 'fullyVisible',
}

/** PostFeed passes `IS_IOS ? 5 : 1`. */
export const FEED_MAX_TO_RENDER_PER_BATCH = IS_IOS ? 5 : 1

/**
 * Knobs that shape the mounted list. Changing any of them regenerates the
 * data and remounts the list, so every run starts from a known state.
 */
export function listKey(config: LabConfig): string {
  return [
    config.seed,
    config.initialRows,
    config.leadingRows,
    config.minIndexForVisible,
    config.listHeader,
    config.removeClippedSubviews,
    config.windowSize,
    config.initialNumToRender,
    config.maxToRenderPerBatch,
    config.resize,
    config.resizeScope,
    config.resizeDelayMs,
  ].join(':')
}

export type ScenarioId = 1 | 2 | 3 | 4 | 5 | 6

export type Scenario = {
  id: ScenarioId
  title: string
  /** One-line recipe, shown above the list. */
  recipe: string
  /** Expected result on unpatched RN 0.86.3 and why, from the prototype's patch notes. */
  expected: string
  /** Whether the preset reproduces it on every run, rather than on some. */
  deterministic: boolean
  /** Knobs applied on top of `DEFAULT_CONFIG`. */
  preset: Partial<LabConfig>
}

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Idle prepend (control)',
    recipe: 'Tap ↓ 3 screens, wait for “idle”, then tap Now.',
    expected:
      'Holds: settled drift 0–1pt and VL “shifted +10”. At rest nothing is queued, so the derived-state pass shifts the window, and the first scroll event after the prepend is the native correction itself. A large max with a ~0 settled drift is the interior spacer rescaling as the average cell length moves (VL note 1), not a lost position.',
    deterministic: true,
    preset: {},
  },
  {
    id: 2,
    title: 'Prepend mid-drag or mid-fling',
    recipe:
      'Tap ↓ 3 screens, arm On release, then flick and let go. Or arm Mid-drag and keep your finger moving.',
    expected:
      'Often loses the position. VL shifts the window and sets pending to 1, then a scroll event dispatched before the new rows mounted (old offset, old content height) spends it. The window is recomputed from that stale offset and unmounts the anchor, and the offset jumps by hundreds to thousands of pt. Readout: first event “stale”. If it says “VL missed” instead, a cells update was queued: that is scenario 5.',
    deterministic: false,
    preset: {prependCount: 15},
  },
  {
    id: 3,
    title: 'Tall prepend during a top bounce',
    recipe:
      'Scroll down a little, arm Top, then fling up so the list bounces at the top. Android has no bounce: Top fires on reaching the top.',
    expected:
      'Native corrects by the full height, then the next window pass maps the corrected offset through estimated heights for the new rows (about a third of their real height here), pushes `first` past the anchor and unmounts it in the same transaction. iOS then applies 0 minus the anchor’s old origin (a teleport); Android skips the correction. Readout: anchor unmounted, verdict lost. The trigger is prepended height beyond (windowSize − 1) / 2 screens, so also try Now at rest at the top.',
    deterministic: false,
    preset: {prependCount: 15, prependHeights: 'tall'},
  },
  {
    id: 4,
    title: 'Prepended rows re-measure shorter',
    recipe:
      'iOS: tap ↑ Top, arm Top, pull down and let go. Android or at rest: Knobs → ListHeaderComponent on, clipping off, then Now at the top.',
    expected:
      'The correction lands, but the old first row is left below the viewport’s top edge, so the next transaction anchors on the view above it: the spacer standing in for the new rows. When those rows mount far shorter than their estimate, the spacer’s origin doesn’t move, nothing is corrected, and the content jumps up by the estimate error, about a screen or more.',
    deterministic: false,
    preset: {prependCount: 15, prependHeights: 'short', initialNumToRender: 3},
  },
  {
    id: 5,
    title: 'Batched cells update + prepend',
    recipe:
      'Tap ↓ 3 screens, wait for “idle”, then tap Now. This preset queues a cells update in the same tick, as every scroll frame does.',
    expected:
      'The queued updater runs first and returns a render mask sized for the new count, so getDerivedStateFromProps sees no change and returns early: no window shift, no pending, a stale firstVisibleItemKey (readout: “VL missed”). With 20 rows the anchor’s new index falls outside the unshifted window and it is unmounted: iOS teleports, Android skips the correction. With 9 or fewer it holds by luck. Unforced, this is any prepend while scroll events are flowing.',
    deterministic: true,
    preset: {prependCount: 20, queueCellsUpdate: true},
  },
  {
    id: 6,
    title: 'Leading row, minIndexForVisible 0',
    recipe:
      'At the top, tap Now. Then Knobs → minIndexForVisible 1 and repeat: that should hold.',
    expected:
      'The key at minIndexForVisible is the leading row’s, which a prepend below it doesn’t change, so VL sees no prepend (readout: “key unchanged”). Natively the leading row is the first visible view, so it is the anchor, and it doesn’t move: the first post is pushed down by the whole prepend, drift ≈ +prepended height. Deeper down VL still never shifts its window, so a 40-row prepend can unmount the anchor there.',
    deterministic: true,
    preset: {leadingRows: 1, minIndexForVisible: 0},
  },
]

export function scenarioConfig(id: ScenarioId): LabConfig {
  const scenario = SCENARIOS.find(s => s.id === id)
  return {...DEFAULT_CONFIG, ...scenario?.preset}
}
