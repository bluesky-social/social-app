import {type HostInstance, Platform, type View} from 'react-native'

import {Logger} from '#/logger'
import {IS_IOS} from '#/env'
import {
  classifyRun,
  describeOscillation,
  detectOscillation,
  type Oscillation,
  type ScrollSample,
  type Verdict,
  VERDICT_LABEL,
} from './analysis'
import {
  type AnchorRule,
  type GestureTrigger,
  type ScenarioId,
  type Trigger,
} from './config'
import {type LabRow} from './data'
import {
  getContentContainer,
  queueCellsUpdate,
  readVirtualizedList,
  type VLSnapshot,
} from './virtualizedList'

/*
 * No context on purpose: a logger with a context drops its debug lines
 * whenever EXPO_PUBLIC_LOG_DEBUG is set and doesn't list that context. Without
 * one, every run reaches the in-app System Log whatever the env says.
 */
const logger = Logger.create()

/** Stable prefix for every line this lab logs. */
export const LOG_PREFIX = 'PrependLab:'

/** No scroll, content-size or row-resize activity for this long counts as idle. */
const IDLE_MS = 500
/**
 * Between a JS commit and the native mount, `measureInWindow` reads the new
 * layout against the old scroll offset, a transient that never reaches the
 * screen. Samples wait for a scroll event carrying the new content height
 * (the mount has happened) or this long, whichever comes first.
 */
const MOUNT_GRACE_MS = 100
/** A settled anchor must hold still for this long. */
const STABLE_MS = 300
/** Give up waiting for a run to settle after this long. */
const SETTLE_TIMEOUT_MS = 12e3
/** A native scroll event moving further than this is listed as a jump. */
const JUMP_PT = 100
/** iOS overscroll depth that fires the Top trigger. */
const TOP_BOUNCE_PT = 20
/** Mid-drag fires this long into a drag, if the finger is still down. */
const MID_DRAG_MS = 250
const MEASURE_TIMEOUT_MS = 200
const MAX_TRAIL = 24
/** Native scroll events kept for oscillation detection. */
const SAMPLE_HISTORY_MS = 5000

type ViewInstance = React.ComponentRef<typeof View>
type ViewRef = {current: ViewInstance | null}

type Detection = 'shifted' | 'missed' | 'keyUnchanged' | 'unknown'

export type {Verdict} from './analysis'

type Fire = {
  t: number
  vlBefore: VLSnapshot | null
  contentHeightBefore: number | null
  committed: boolean
  vlCommit: VLSnapshot | null
  detection: Detection
  anchorMountedAtCommit: boolean | null
  /** The first native scroll event after the commit, and whether it still carried the old content height. */
  firstEvent: {y: number; contentHeight: number; stale: boolean} | null
}

type Position = {
  /** Anchor top relative to the list viewport, from `measureInWindow`. */
  y: number | null
  /** Anchor top in content coordinates, from `measureLayout`. */
  contentY: number | null
  /** Last native scroll event's offset. */
  offset: number
  contentHeight: number | null
}

type ActiveRun = {
  n: number
  trigger: Trigger
  scenario: ScenarioId | null
  config: Record<string, string | number | boolean>
  rowsPerPrepend: number
  startedAt: number
  anchorId: string | null
  anchorRule: AnchorRule | 'fallback' | null
  before: Position
  fires: Fire[]
  expectedFires: number
  commitAt: number | null
  /** Set at each commit until the native side has plausibly mounted it. */
  awaitingMountSince: number | null
  after: number | null
  afterMounted: boolean | null
  contentYAfterCommit: number | null
  lastY: number | null
  lastSampleAt: number
  /** Frame-to-frame anchor moves, with the time they took. */
  steps: {dy: number; dt: number}[]
  maxAbsDrift: number | null
  stableSince: number
  lastVL: VLSnapshot | null
  vlTrail: string[]
  mountTrail: string[]
  lastMounted: boolean | null
  /** When the anchor was first unmounted after a commit. */
  lostAt: number | null
  /** Rows from later batches than this were inserted by the run. */
  maxBatchAtStart: number
  /** Lowest raw `pendingScrollUpdateCount` seen, which stock RN can take below 0. */
  pendingMin: number | null
  oscillatingAtStart: boolean
  oscillation: Oscillation | null
  jumps: string[]
  moved: boolean
  finished: boolean
  timers: ReturnType<typeof setTimeout>[]
}

export type RunRecord = {
  n: number
  platform: string
  scenario: ScenarioId | null
  trigger: Trigger
  config: Record<string, string | number | boolean>
  rowsPerPrepend: number
  fires: number
  anchor: string | null
  anchorRule: string | null
  verdict: Verdict
  /** The list was dragged or flung during the run, so screen drift includes your own scrolling. */
  moving: boolean
  settledBy: 'idle' | 'timeout' | 'interrupted' | 'oscillation'
  durationMs: number
  drift: {
    /** First sample once the native side has mounted the commit. */
    after: number | null
    settled: number | null
    maxAbs: number | null
    /** Largest frame-to-frame move of the anchor, and the median: a teleport stands out against scrolling. */
    maxStep: number | null
    medianStep: number | null
    /** The largest step beyond 4x the run's median speed. Over 150pt on a moving run reads as a jump. */
    jumpExcess: number | null
  }
  /**
   * `measured`: the anchor's settled position. `data`: the anchor is
   * unmounted, so the settled drift is the inserted rows' height minus the
   * offset change, which is exact when no correction ran.
   */
  driftSource: 'measured' | 'data' | null
  /** Total height of the rows the run inserted above the anchor. */
  insertedAbove: number
  /** The same drift from layout (content y) and native scroll offsets, as a cross-check. */
  driftFromOffsets: number | null
  /** How far the prepend pushed the anchor in content coordinates, i.e. what mVCP must correct. */
  expectedCorrection: number | null
  before: Position
  settled: Position & {anchorMounted: boolean; firstVisible: string | null}
  vl: {
    detection: Detection
    shift: number | null
    pendingAtCommit: number | null
    firstEvent: string | null
    anchorMountedAtCommit: boolean | null
  }[]
  /** Lowest raw `pendingScrollUpdateCount` during the run. Stock RN can take it below 0. */
  pendingMin: number | null
  /** The post-prepend feedback loop, if the run was caught in it. */
  oscillation: (Oscillation & {sinceCommitMs: number | null}) | null
  /** A loop was already running when the prepend fired, so the run says little about the prepend. */
  oscillatingAtStart: boolean
  vlTrail: string[]
  mountTrail: string[]
  jumps: string[]
  summary: string
}

export type ProbeSnapshot = {
  status: 'idle' | 'moving' | 'dragging' | 'oscillating'
  oscillation: Oscillation | null
  offset: number
  contentHeight: number | null
  viewportHeight: number | null
  rendered: string
  visible: string
  anchor: {label: string; mounted: boolean; y: number | null} | null
  vl: VLSnapshot | null
  armed: string | null
  run: {n: number; active: boolean; summary: string; details: string[]} | null
  runCount: number
}

export type ProbeOptions = {
  rowsPerPrepend: number
  anchorRule: AnchorRule
  queueCellsUpdate: boolean
  delayMs: number
  repeatCount: number
  repeatIntervalMs: number
  /** Late resizes land this long after a row mounts, so a run can't be idle sooner. */
  resizeDelayMs: number | null
  scenario: ScenarioId | null
  config: Record<string, string | number | boolean>
}

function now() {
  return performance.now()
}

function round(n: number) {
  return Math.round(n * 10) / 10
}

function fmt(n: number | null | undefined, signed = false) {
  if (n == null) return '–'
  const s = round(n).toFixed(1)
  return signed && n >= 0 ? `+${s}` : s
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((x, y) => x - y)
  return sorted[Math.floor(sorted.length / 2)]
}

function pushCapped(list: string[], entry: string) {
  if (list.length < MAX_TRAIL) list.push(entry)
}

function measureInWindow(
  view: ViewInstance | null | undefined,
): Promise<{y: number; height: number} | null> {
  return new Promise(resolve => {
    if (!view) {
      resolve(null)
      return
    }
    const timer = setTimeout(() => resolve(null), MEASURE_TIMEOUT_MS)
    view.measureInWindow((_x, y, width, height) => {
      clearTimeout(timer)
      resolve(width === 0 && height === 0 ? null : {y, height})
    })
  })
}

function measureContentY(
  view: ViewInstance | null | undefined,
  container: unknown,
): Promise<number | null> {
  return new Promise(resolve => {
    if (!view || !container) {
      resolve(null)
      return
    }
    const timer = setTimeout(() => resolve(null), MEASURE_TIMEOUT_MS)
    try {
      view.measureLayout(
        container as HostInstance,
        (_x, y) => {
          clearTimeout(timer)
          resolve(y)
        },
        () => {
          clearTimeout(timer)
          resolve(null)
        },
      )
    } catch {
      clearTimeout(timer)
      resolve(null)
    }
  })
}

function segments(indices: number[]) {
  if (!indices.length) return 'none'
  const sorted = [...indices].sort((x, y) => x - y)
  const parts: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (const i of sorted.slice(1)) {
    if (i !== prev + 1) {
      parts.push(start === prev ? `${start}` : `${start}–${prev}`)
      start = i
    }
    prev = i
  }
  parts.push(start === prev ? `${start}` : `${start}–${prev}`)
  return `${parts.join(', ')} (${sorted.length})`
}

function describeDetection(fire: Fire) {
  switch (fire.detection) {
    case 'shifted':
      return `VL shifted ${fmtShift(fire)}`
    case 'missed':
      return 'VL missed the prepend'
    case 'keyUnchanged':
      return 'VL: key unchanged'
    case 'unknown':
      return 'VL: n/a'
  }
}

function fmtShift(fire: Fire) {
  if (!fire.vlBefore || !fire.vlCommit) return '?'
  const shift = fire.vlCommit.first - fire.vlBefore.first
  return shift >= 0 ? `+${shift}` : `${shift}`
}

/**
 * Everything the lab measures, outside React state so that recording never
 * re-renders the list. The list, its rows and the readout talk to one
 * instance for the lifetime of the screen.
 */
export class Probe {
  listRef: {current: unknown} = {current: null}
  viewportRef: ViewRef = {current: null}

  private options: ProbeOptions | null = null
  private prepend: (() => void) | null = null

  private mounted = new Map<string, {ref: ViewRef; kind: LabRow['kind']}>()
  private rows: LabRow[] = []
  private rowsById = new Map<string, LabRow>()
  private indexById = new Map<string, number>()
  private keyAtMinIndex: string | null = null

  private offset = 0
  private contentHeight: number | null = null
  private viewportHeight: number | null = null
  private prevEventY: number | null = null
  private lastEventContentHeight: number | null = null
  private viewportLayoutHeight: number | null = null
  private dragging = false
  private lastActivity = 0
  private lastScrollEventAt = 0
  /**
   * The list instance whose callbacks count. Bumped by reset and part of the
   * list's key, so each remount gets a new one. Everything the list
   * reports carries the generation it was created with: a retired list keeps
   * emitting until it unmounts (and its queued `scheduleOnRN` calls land
   * after), and none of that may overwrite the new list's state.
   */
  private generation = 0
  private visible = 'none'
  private samples: ScrollSample[] = []
  private oscillation: {startedAt: number; latest: Oscillation} | null = null

  private resized = new Set<string>()

  anchorId: string | null = null
  private anchorY: number | null = null
  private anchorListeners = new Set<() => void>()

  private armed: GestureTrigger | 'delay' | null = null
  private armedAt = 0
  private armTimer: ReturnType<typeof setTimeout> | null = null
  private topArmedAway = false

  private run: ActiveRun | null = null
  private starting = false
  private runCounter = 0
  runs: RunRecord[] = []

  configure(options: ProbeOptions, prepend: () => void) {
    this.options = options
    this.prepend = prepend
  }

  /**
   * New data, new list: forget the list's state, keep the run history.
   * Returns the generation the next list instance must be created with.
   */
  reset(): number {
    this.generation++
    this.stop()
    this.mounted.clear()
    this.resized.clear()
    this.listRef.current = null
    this.offset = 0
    this.contentHeight = null
    this.viewportHeight = null
    this.prevEventY = null
    this.lastEventContentHeight = null
    this.samples = []
    this.dragging = false
    this.visible = 'none'
    this.lastActivity = now()
    this.setAnchor(null)
    return this.generation
  }

  /** The generation the current list instance was created with. */
  currentGeneration() {
    return this.generation
  }

  private isCurrent(generation: number) {
    return generation === this.generation
  }

  /**
   * The screen is going away: stop timers and the sampling loop. It leaves
   * the generation alone, so an effect that re-runs doesn't orphan the list.
   */
  dispose() {
    this.stop()
  }

  private stop() {
    this.disarm()
    if (this.run) {
      this.run.finished = true
      for (const timer of this.run.timers) clearTimeout(timer)
      this.run = null
    }
    this.endOscillation(now(), 'reset')
  }

  setList = (generation: number, instance: unknown) => {
    if (this.isCurrent(generation)) this.listRef.current = instance
  }

  clearRuns() {
    this.runs = []
  }

  onViewportLayout = (height: number) => {
    this.viewportLayoutHeight = height
  }

  // --- rows ---

  mountRow = (
    generation: number,
    id: string,
    kind: LabRow['kind'],
    ref: ViewRef,
  ) => {
    if (!this.isCurrent(generation)) return
    this.mounted.set(id, {ref, kind})
    this.lastActivity = now()
  }

  unmountRow = (generation: number, id: string) => {
    if (!this.isCurrent(generation)) return
    this.mounted.delete(id)
    this.lastActivity = now()
  }

  hasResized = (id: string) => this.resized.has(id)

  markResized = (generation: number, id: string) => {
    if (!this.isCurrent(generation)) return
    this.resized.add(id)
    this.lastActivity = now()
  }

  /** Called from the list's layout effect, after VirtualizedList has rendered the new data. */
  onRowsCommitted = (
    generation: number,
    rows: LabRow[],
    minIndexForVisible: number,
  ) => {
    if (!this.isCurrent(generation)) return
    this.rows = rows
    this.rowsById.clear()
    this.indexById.clear()
    rows.forEach((row, index) => {
      this.rowsById.set(row.id, row)
      this.indexById.set(row.id, index)
    })
    this.keyAtMinIndex = rows[minIndexForVisible]?.id ?? null

    const run = this.run
    const fire = run?.fires.find(f => !f.committed)
    if (!run || !fire) return
    fire.committed = true
    fire.vlCommit = readVirtualizedList(this.listRef.current)
    fire.detection = this.detect(fire)
    fire.anchorMountedAtCommit = run.anchorId
      ? this.mounted.has(run.anchorId)
      : null
    run.commitAt = now()
    if (fire.anchorMountedAtCommit === false && run.lostAt == null) {
      run.lostAt = run.commitAt
    }
    run.awaitingMountSince = run.commitAt
    this.notePending(run, fire.vlCommit)
    if (run.fires.length === 1) this.startSampling(run)
  }

  private detect(fire: Fire): Detection {
    const before = fire.vlBefore
    const commit = fire.vlCommit
    if (!before || !commit) return 'unknown'
    if (commit.pending > before.pending) return 'shifted'
    // The derived-state pass always writes the key when it runs; a stale one means it returned early.
    if (commit.key !== this.keyAtMinIndex) return 'missed'
    if (before.key === this.keyAtMinIndex) return 'keyUnchanged'
    return 'unknown'
  }

  private notePending(run: ActiveRun, vl: VLSnapshot | null) {
    if (!vl) return
    run.pendingMin = Math.min(run.pendingMin ?? vl.pending, vl.pending)
  }

  onViewableItemsChanged = (
    generation: number,
    {viewableItems}: {viewableItems: Array<{index?: number | null}>},
  ) => {
    if (!this.isCurrent(generation)) return
    const indices = viewableItems
      .map(v => v.index)
      .filter((i): i is number => i != null)
    this.visible = indices.length
      ? `${Math.min(...indices)}–${Math.max(...indices)}`
      : 'none'
  }

  onContentSizeChange = (
    generation: number,
    _width: number,
    height: number,
  ) => {
    if (!this.isCurrent(generation)) return
    this.contentHeight = height
    this.lastActivity = now()
  }

  // --- native scroll events (from the UI thread via scheduleOnRN) ---

  onNativeScroll = (
    generation: number,
    y: number,
    contentHeight: number,
    viewportHeight: number,
  ) => {
    if (!this.isCurrent(generation)) return
    const t = now()
    this.lastActivity = t
    this.lastScrollEventAt = t
    this.offset = y
    this.contentHeight = contentHeight
    this.viewportHeight = viewportHeight

    const run = this.run
    if (run) {
      if (this.prevEventY != null) {
        const dy = y - this.prevEventY
        if (Math.abs(dy) >= JUMP_PT) {
          pushCapped(
            run.jumps,
            `t+${Math.round(t - run.startedAt)} dy ${fmt(dy, true)}`,
          )
        }
      }
      const fire = run.fires.at(-1)
      if (fire?.committed) {
        const stale =
          fire.contentHeightBefore != null &&
          Math.abs(contentHeight - fire.contentHeightBefore) < 0.5
        if (!fire.firstEvent) fire.firstEvent = {y, contentHeight, stale}
        if (!stale) run.awaitingMountSince = null
      }
    }
    this.prevEventY = y
    this.lastEventContentHeight = contentHeight

    this.samples.push({t, y, contentHeight})
    while (this.samples.length && this.samples[0].t < t - SAMPLE_HISTORY_MS) {
      this.samples.shift()
    }
    const osc = this.dragging ? null : detectOscillation(this.samples, t)
    if (osc) this.noteOscillation(t, osc)

    if (this.armed === 'top') {
      if (y > 50) this.topArmedAway = true
      const hit = IS_IOS ? y < -TOP_BOUNCE_PT : this.topArmedAway && y <= 0.5
      if (hit) {
        this.disarm()
        void this.startRun('top')
      }
    }
  }

  onDrag = (generation: number, begin: boolean) => {
    if (!this.isCurrent(generation)) return
    this.dragging = begin
    this.lastActivity = now()
    if (this.run) this.run.moved = true
    if (begin && this.armed === 'drag') {
      if (this.armTimer) clearTimeout(this.armTimer)
      this.armTimer = setTimeout(() => {
        if (this.dragging && this.armed === 'drag') {
          this.disarm()
          void this.startRun('drag')
        }
      }, MID_DRAG_MS)
    }
    if (!begin && this.armed === 'release') {
      this.disarm()
      void this.startRun('release')
    }
  }

  onMomentumEnd = (generation: number) => {
    if (!this.isCurrent(generation)) return
    this.lastActivity = now()
  }

  // --- the post-prepend feedback loop, tracked as episodes ---

  private noteOscillation(t: number, osc: Oscillation) {
    if (this.oscillation) {
      this.oscillation.latest = osc
      return
    }
    this.oscillation = {startedAt: osc.since, latest: osc}
    logger.debug(
      `${LOG_PREFIX} oscillation started · ${describeOscillation(osc)}`,
      {oscillation: osc, platform: Platform.OS, at: Math.round(t)},
    )
  }

  private endOscillation(t: number, reason: 'stopped' | 'reset') {
    const episode = this.oscillation
    if (!episode) return
    this.oscillation = null
    logger.debug(
      `${LOG_PREFIX} oscillation ended (${reason}) after ${Math.round((t - episode.startedAt) / 1000)}s · ${describeOscillation(episode.latest)}`,
      {oscillation: episode.latest, platform: Platform.OS},
    )
  }

  private currentOscillation(t: number): Oscillation | null {
    if (this.dragging) return null
    const osc = detectOscillation(this.samples, t)
    if (!osc) this.endOscillation(t, 'stopped')
    return osc
  }

  /** Housekeeping for the readout's poll: live anchor position, loop end. */
  async poll() {
    this.currentOscillation(now())
    await this.refreshAnchor()
  }

  // --- anchor highlight store (rows subscribe to know if they are the anchor) ---

  subscribeAnchor = (listener: () => void) => {
    this.anchorListeners.add(listener)
    return () => {
      this.anchorListeners.delete(listener)
    }
  }

  private setAnchor(id: string | null) {
    this.anchorId = id
    this.anchorY = null
    for (const listener of this.anchorListeners) listener()
  }

  // --- triggers ---

  /** Arms a gesture or delay trigger, or cancels it if it's already armed. */
  arm(kind: GestureTrigger | 'delay') {
    if (this.armed === kind) {
      this.disarm()
      return
    }
    this.disarm()
    this.armed = kind
    this.armedAt = now()
    this.topArmedAway = false
    if (kind === 'delay') {
      this.armTimer = setTimeout(() => {
        this.disarm()
        void this.startRun('delay')
      }, this.options?.delayMs ?? 2000)
    }
  }

  armedTrigger() {
    return this.armed
  }

  private disarm() {
    if (this.armTimer) clearTimeout(this.armTimer)
    this.armTimer = null
    this.armed = null
  }

  prependNow() {
    void this.startRun('now')
  }

  prependRepeatedly() {
    void this.startRun('repeat')
  }

  // --- runs ---

  private async startRun(trigger: Trigger) {
    const options = this.options
    if (!options || this.starting) return
    this.starting = true
    const generation = this.generation
    try {
      if (this.run) await this.finish(this.run, 'interrupted')

      const anchor = await this.pickAnchor(options.anchorRule)
      const container = getContentContainer(this.listRef.current)
      const anchorRef = anchor ? this.mounted.get(anchor.id)?.ref : undefined
      const contentY = await measureContentY(anchorRef?.current, container)
      if (!this.isCurrent(generation)) return
      this.setAnchor(anchor?.id ?? null)
      const vlBefore = readVirtualizedList(this.listRef.current)

      const run: ActiveRun = {
        n: ++this.runCounter,
        trigger,
        scenario: options.scenario,
        config: options.config,
        rowsPerPrepend: options.rowsPerPrepend,
        startedAt: now(),
        anchorId: anchor?.id ?? null,
        anchorRule: anchor?.rule ?? null,
        before: {
          y: anchor?.y ?? null,
          contentY,
          offset: this.offset,
          contentHeight: this.contentHeight,
        },
        fires: [],
        expectedFires: trigger === 'repeat' ? options.repeatCount : 1,
        commitAt: null,
        awaitingMountSince: null,
        after: null,
        afterMounted: null,
        contentYAfterCommit: null,
        lastY: anchor?.y ?? null,
        lastSampleAt: now(),
        steps: [],
        maxAbsDrift: null,
        stableSince: now(),
        lastVL: null,
        vlTrail: [],
        mountTrail: [],
        lastMounted: anchor ? true : null,
        lostAt: null,
        maxBatchAtStart: Math.max(0, ...this.rows.map(r => r.batch)),
        pendingMin: vlBefore?.pending ?? null,
        oscillatingAtStart: this.currentOscillation(now()) != null,
        oscillation: null,
        jumps: [],
        // Dragging, flinging (events in the last 100ms) or a gesture trigger.
        moved:
          this.dragging ||
          now() - this.lastScrollEventAt < 100 ||
          trigger === 'drag' ||
          trigger === 'release' ||
          trigger === 'top',
        finished: false,
        timers: [],
      }
      this.run = run
      this.anchorY = run.before.y

      this.fire(run)
      for (let i = 1; i < run.expectedFires; i++) {
        run.timers.push(
          setTimeout(() => {
            if (this.run === run) this.fire(run)
          }, i * options.repeatIntervalMs),
        )
      }
    } finally {
      this.starting = false
    }
  }

  private fire(run: ActiveRun) {
    const options = this.options
    run.fires.push({
      t: Math.round(now() - run.startedAt),
      vlBefore: readVirtualizedList(this.listRef.current),
      contentHeightBefore: this.contentHeight ?? this.lastEventContentHeight,
      committed: false,
      vlCommit: null,
      detection: 'unknown',
      anchorMountedAtCommit: null,
      firstEvent: null,
    })
    // Same tick as the prepend, so both land in one render.
    if (options?.queueCellsUpdate) queueCellsUpdate(this.listRef.current)
    this.prepend?.()
  }

  private async pickAnchor(rule: AnchorRule) {
    const viewport = await measureInWindow(this.viewportRef.current)
    if (!viewport) return null
    const rects = await Promise.all(
      [...this.mounted.entries()]
        .filter(([, entry]) => entry.kind === 'content')
        .map(async ([id, entry]) => {
          const rect = await measureInWindow(entry.ref.current)
          return rect ? {id, y: rect.y - viewport.y, height: rect.height} : null
        }),
    )
    const rows = rects.filter(r => r != null).sort((x, y) => x.y - y.y)
    const bottom = viewport.height
    const fully = rows.find(r => r.y >= -0.5 && r.y + r.height <= bottom + 0.5)
    const cut = rows.find(r => r.y < 0.5 && r.y + r.height > 0.5)
    const onScreen = rows.find(r => r.y + r.height > 0 && r.y < bottom)
    if (rule === 'fullyVisible' && fully) return {...fully, rule}
    if (rule === 'topEdge' && cut) return {...cut, rule}
    return onScreen ? {...onScreen, rule: 'fallback' as const} : null
  }

  private startSampling(run: ActiveRun) {
    const tick = () => {
      if (this.run !== run || run.finished) return
      void this.sample(run).then(done => {
        if (!done && this.run === run) requestAnimationFrame(tick)
      })
    }
    requestAnimationFrame(tick)
  }

  /** One frame of a run. Resolves true once the run has been finished. */
  private async sample(run: ActiveRun): Promise<boolean> {
    const t = now()
    const since = Math.round(t - run.startedAt)

    const vl = readVirtualizedList(this.listRef.current)
    if (
      vl &&
      (!run.lastVL ||
        vl.pending !== run.lastVL.pending ||
        vl.first !== run.lastVL.first ||
        vl.last !== run.lastVL.last)
    ) {
      pushCapped(
        run.vlTrail,
        `t+${since} pending ${vl.pending} window ${vl.first}..${vl.last} jsOffset ${fmt(vl.jsOffset)}`,
      )
    }
    run.lastVL = vl
    this.notePending(run, vl)

    const entry = run.anchorId ? this.mounted.get(run.anchorId) : undefined
    const mounted = !!entry
    if (run.lastMounted !== mounted) {
      pushCapped(
        run.mountTrail,
        `t+${since} ${mounted ? 'mounted' : 'unmounted'}`,
      )
      run.lastMounted = mounted
      if (!mounted && run.lostAt == null) run.lostAt = t
    }

    let y: number | null = null
    if (entry) {
      const [viewport, rect] = await Promise.all([
        measureInWindow(this.viewportRef.current),
        measureInWindow(entry.ref.current),
      ])
      if (viewport && rect) y = rect.y - viewport.y
      if (run.contentYAfterCommit == null) {
        run.contentYAfterCommit = await measureContentY(
          entry.ref.current,
          getContentContainer(this.listRef.current),
        )
      }
    }
    if (this.run !== run) return true

    if (
      run.awaitingMountSince != null &&
      t - run.awaitingMountSince >= MOUNT_GRACE_MS
    ) {
      run.awaitingMountSince = null
    }
    if (run.awaitingMountSince == null) {
      if (run.after == null && run.afterMounted == null) {
        run.after = y
        run.afterMounted = mounted
      }
      if (y != null && run.before.y != null) {
        const drift = Math.abs(y - run.before.y)
        run.maxAbsDrift = Math.max(run.maxAbsDrift ?? 0, drift)
      }
      if (y != null && run.lastY != null) {
        run.steps.push({dy: Math.abs(y - run.lastY), dt: t - run.lastSampleAt})
      }
      const changed =
        (y == null) !== (run.lastY == null) ||
        (y != null && run.lastY != null && Math.abs(y - run.lastY) > 0.5)
      if (changed) run.stableSince = t
      run.lastY = y
      run.lastSampleAt = t
      this.anchorY = y
    }

    const allCommitted =
      run.fires.length === run.expectedFires &&
      run.fires.every(f => f.committed)

    // A loop never goes idle: record it rather than waiting out the timeout.
    const osc = run.commitAt != null ? this.currentOscillation(t) : null
    if (osc) {
      run.oscillation = osc
      await this.finish(run, 'oscillation')
      return true
    }

    const idleMs = Math.max(
      IDLE_MS,
      (this.options?.resizeDelayMs ?? 0) + STABLE_MS,
    )
    const idle = t - this.lastActivity >= idleMs && !this.dragging
    const stable = t - run.stableSince >= STABLE_MS
    if (allCommitted && run.commitAt != null) {
      if (
        idle &&
        stable &&
        run.awaitingMountSince == null &&
        t - run.commitAt >= idleMs
      ) {
        await this.finish(run, 'idle')
        return true
      }
      if (t - run.commitAt >= SETTLE_TIMEOUT_MS) {
        await this.finish(run, 'timeout')
        return true
      }
    }
    return false
  }

  private async finish(run: ActiveRun, settledBy: RunRecord['settledBy']) {
    if (run.finished) return
    run.finished = true
    if (this.run === run) this.run = null
    for (const timer of run.timers) clearTimeout(timer)

    const entry = run.anchorId ? this.mounted.get(run.anchorId) : undefined
    const container = getContentContainer(this.listRef.current)
    const [viewport, rect, contentY, visibleNow] = await Promise.all([
      measureInWindow(this.viewportRef.current),
      measureInWindow(entry?.ref.current),
      measureContentY(entry?.ref.current, container),
      this.pickAnchor('fullyVisible'),
    ])
    const y = viewport && rect ? rect.y - viewport.y : null
    const settled = {
      y,
      contentY,
      offset: this.offset,
      contentHeight: this.contentHeight,
      anchorMounted: !!entry,
      firstVisible: visibleNow ? this.label(visibleNow.id) : null,
    }
    const offsetDelta = settled.offset - run.before.offset
    // Every prepend lands above every content row, so above the anchor too.
    const insertedAbove = this.rows
      .filter(r => r.kind === 'content' && r.batch > run.maxBatchAtStart)
      .reduce((sum, r) => sum + r.height, 0)
    const measuredDrift =
      y != null && run.before.y != null ? y - run.before.y : null
    const driftFromOffsets =
      contentY != null && run.before.contentY != null
        ? contentY - settled.offset - (run.before.contentY - run.before.offset)
        : null
    const expectedCorrection =
      run.contentYAfterCommit != null && run.before.contentY != null
        ? run.contentYAfterCommit - run.before.contentY
        : null
    const dys = run.steps.map(s => s.dy)
    const maxStep = dys.length ? Math.max(...dys) : null
    const medianStep = median(dys)
    const medianSpeed = median(run.steps.map(s => s.dy / Math.max(1, s.dt)))
    const jumpExcess = run.steps.length
      ? Math.max(...run.steps.map(s => s.dy - 4 * (medianSpeed ?? 0) * s.dt))
      : null

    /*
     * A moving run's screen drift is mostly the user's own scrolling, so it is
     * judged on discontinuities instead: the anchor unmounted within a second
     * of the commit (windowSize keeps several screens mounted, so scrolling
     * alone doesn't do that), or a frame-to-frame move far beyond the run's
     * speed. Scrolling the anchor away later is not a verdict.
     */
    const lostEarly =
      run.lostAt != null &&
      run.commitAt != null &&
      run.lostAt - run.commitAt < 1000
    const verdict = classifyRun({
      hasAnchor: run.anchorId != null,
      moving: run.moved,
      oscillating: run.oscillation != null,
      anchorMeasured: !!entry && y != null,
      drift: measuredDrift,
      offsetDelta,
      insertedAbove,
      lostEarly,
      jumpExcess,
    })
    /*
     * An anchor that is no longer mounted can still be placed when no
     * correction ran: it is exactly the inserted rows lower, less whatever the
     * offset moved. That is the scenario 6 case, where the anchor falls outside
     * VirtualizedList's unshifted window and unmounts.
     */
    let drift = measuredDrift
    let driftSource: RunRecord['driftSource'] =
      measuredDrift != null ? 'measured' : null
    if (drift == null && verdict === 'pushedDown') {
      drift = insertedAbove - offsetDelta
      driftSource = 'data'
    }

    const record: RunRecord = {
      n: run.n,
      platform: Platform.OS,
      scenario: run.scenario,
      trigger: run.trigger,
      config: run.config,
      rowsPerPrepend: run.rowsPerPrepend,
      fires: run.fires.length,
      anchor: run.anchorId ? this.label(run.anchorId) : null,
      anchorRule: run.anchorRule,
      verdict,
      moving: run.moved,
      settledBy,
      durationMs: Math.round(now() - run.startedAt),
      drift: {
        after:
          run.after != null && run.before.y != null
            ? round(run.after - run.before.y)
            : null,
        settled: drift != null ? round(drift) : null,
        maxAbs: run.maxAbsDrift != null ? round(run.maxAbsDrift) : null,
        maxStep: maxStep != null ? round(maxStep) : null,
        medianStep: medianStep != null ? round(medianStep) : null,
        jumpExcess: jumpExcess != null ? round(jumpExcess) : null,
      },
      driftSource,
      insertedAbove: round(insertedAbove),
      driftFromOffsets:
        driftFromOffsets != null ? round(driftFromOffsets) : null,
      expectedCorrection:
        expectedCorrection != null ? round(expectedCorrection) : null,
      before: run.before,
      settled,
      vl: run.fires.map(fire => ({
        detection: fire.detection,
        shift:
          fire.vlBefore && fire.vlCommit
            ? fire.vlCommit.first - fire.vlBefore.first
            : null,
        pendingAtCommit: fire.vlCommit?.pending ?? null,
        firstEvent: fire.firstEvent
          ? `${fire.firstEvent.stale ? 'stale' : 'fresh'} (y ${fmt(fire.firstEvent.y)}, content ${fmt(fire.firstEvent.contentHeight)})`
          : null,
        anchorMountedAtCommit: fire.anchorMountedAtCommit,
      })),
      pendingMin: run.pendingMin,
      oscillation: run.oscillation
        ? {
            ...run.oscillation,
            sinceCommitMs:
              run.commitAt != null
                ? Math.round(run.oscillation.since - run.commitAt)
                : null,
          }
        : null,
      oscillatingAtStart: run.oscillatingAtStart,
      vlTrail: run.vlTrail,
      mountTrail: run.mountTrail,
      jumps: run.jumps,
      summary: '',
    }
    record.summary = this.summarize(record, run.fires[0])
    this.runs.push(record)
    logger.debug(`${LOG_PREFIX} ${record.summary}`, {run: record})
  }

  private summarize(record: RunRecord, firstFire: Fire | undefined) {
    const parts = [
      `run #${record.n}`,
      record.scenario ? `S${record.scenario}` : 'custom',
      record.trigger,
      record.platform,
      VERDICT_LABEL[record.verdict],
    ]
    if (record.oscillation) {
      parts.push(describeOscillation(record.oscillation))
      if (record.oscillatingAtStart) parts.push('already oscillating at start')
    } else if (record.moving) {
      parts.push(
        `max step ${fmt(record.drift.maxStep)} (excess ${fmt(record.drift.jumpExcess)})`,
      )
    } else if (record.verdict === 'pushedDown') {
      parts.push(
        `drift ${fmt(record.drift.settled, true)} (no correction, ${record.driftSource === 'data' ? 'anchor unmounted, from row heights' : 'measured'})`,
      )
    } else {
      parts.push(
        `drift ${fmt(record.drift.settled, true)} (max ${fmt(record.drift.maxAbs)})`,
      )
    }
    if (firstFire) parts.push(describeDetection(firstFire))
    if (firstFire?.firstEvent?.stale) parts.push('first event stale')
    if (record.pendingMin != null && record.pendingMin < 0) {
      parts.push(`pending reached ${record.pendingMin}`)
    }
    return parts.join(' · ')
  }

  private label(id: string) {
    const row = this.rowsById.get(id)
    if (!row) return id
    return row.kind === 'leading' ? `Leading ${id}` : `Post ${row.seq}`
  }

  // --- readout ---

  /** Refreshes the anchor's live position while no run is sampling it. */
  async refreshAnchor() {
    if (this.run || !this.anchorId) return
    const entry = this.mounted.get(this.anchorId)
    if (!entry) {
      this.anchorY = null
      return
    }
    const [viewport, rect] = await Promise.all([
      measureInWindow(this.viewportRef.current),
      measureInWindow(entry.ref.current),
    ])
    this.anchorY = viewport && rect ? rect.y - viewport.y : null
  }

  snapshot(): ProbeSnapshot {
    const t = now()
    const indices: number[] = []
    for (const id of this.mounted.keys()) {
      const index = this.indexById.get(id)
      if (index != null) indices.push(index)
    }

    let armed: string | null = null
    if (this.armed === 'delay') {
      const left = (this.options?.delayMs ?? 0) - (t - this.armedAt)
      armed = `fires in ${Math.max(0, left / 1000).toFixed(1)}s`
    } else if (this.armed === 'drag') {
      armed = 'armed: start dragging and keep moving'
    } else if (this.armed === 'release') {
      armed = 'armed: flick and let go'
    } else if (this.armed === 'top') {
      armed = IS_IOS
        ? 'armed: pull or fling into the top bounce'
        : 'armed: scroll or fling back to the top'
    }

    const active = this.run
    const last = this.runs.at(-1)
    let run: ProbeSnapshot['run'] = null
    if (active) {
      const committed = active.fires.filter(f => f.committed).length
      run = {
        n: active.n,
        active: true,
        summary: `run #${active.n} ${active.trigger} · settling (${committed}/${active.expectedFires} committed)`,
        details: [],
      }
    } else if (last) {
      run = {
        n: last.n,
        active: false,
        summary: last.summary,
        details: describeRecord(last),
      }
    }

    const oscillation = this.dragging
      ? null
      : detectOscillation(this.samples, t)
    let status: ProbeSnapshot['status'] = 'moving'
    if (this.dragging) status = 'dragging'
    else if (oscillation) status = 'oscillating'
    else if (t - this.lastActivity >= IDLE_MS) status = 'idle'

    return {
      status,
      oscillation,
      offset: this.offset,
      contentHeight: this.contentHeight,
      viewportHeight: this.viewportHeight,
      rendered: segments(indices),
      visible: this.visible,
      anchor: this.anchorId
        ? {
            label: this.label(this.anchorId),
            mounted: this.mounted.has(this.anchorId),
            y: this.anchorY,
          }
        : null,
      vl: readVirtualizedList(this.listRef.current),
      armed,
      run,
      runCount: this.runs.length,
    }
  }

  scrollToTop() {
    this.scrollToOffset(0)
  }

  /** Scrolls by whole list viewports, measured from the list's own layout. */
  scrollScreens(screens: number) {
    const screen = this.viewportLayoutHeight ?? this.viewportHeight
    if (!screen) return
    this.scrollToOffset(this.offset + screens * screen)
  }

  private scrollToOffset(offset: number) {
    const list = this.listRef.current as {
      scrollToOffset?: (params: {offset: number; animated?: boolean}) => void
    } | null
    list?.scrollToOffset?.({offset: Math.max(0, offset), animated: false})
  }
}

export function describeRecord(record: RunRecord): string[] {
  const {before, settled, drift} = record
  const lines = [
    `anchor ${record.anchor ?? '–'} (${record.anchorRule ?? '–'}) · ${record.fires}× ${record.rowsPerPrepend} rows · settled by ${record.settledBy} in ${record.durationMs}ms`,
    `anchor y  before ${fmt(before.y)} → after ${fmt(drift.after, true)} → settled ${fmt(drift.settled, true)} · max |drift| ${fmt(drift.maxAbs)}`,
    `anchor steps  max ${fmt(drift.maxStep)} · median ${fmt(drift.medianStep)} · excess over 4× median speed ${fmt(drift.jumpExcess)}${record.moving ? ' · moving run: drift includes your scrolling' : ''}`,
    `drift source  ${record.driftSource ?? '–'} · rows inserted above the anchor ${fmt(record.insertedAbove)}`,
    `cross-check  drift from content y and native offsets ${fmt(record.driftFromOffsets, true)}`,
    `offset  ${fmt(before.offset)} → ${fmt(settled.offset)} (Δ ${fmt(settled.offset - before.offset, true)}) · expected correction ${fmt(record.expectedCorrection, true)}`,
    `content  ${fmt(before.contentHeight)} → ${fmt(settled.contentHeight)}${before.contentHeight != null && settled.contentHeight != null ? ` (Δ ${fmt(settled.contentHeight - before.contentHeight, true)})` : ''}`,
    `settled  anchor ${settled.anchorMounted ? 'mounted' : 'unmounted'} · first fully visible ${settled.firstVisible ?? '–'}`,
  ]
  record.vl.forEach((fire, i) => {
    lines.push(
      `fire ${i + 1}  ${fire.detection}${fire.shift != null ? ` (window ${fire.shift >= 0 ? '+' : ''}${fire.shift})` : ''} · pending at commit ${fire.pendingAtCommit ?? '–'} · anchor at commit ${fire.anchorMountedAtCommit == null ? '–' : fire.anchorMountedAtCommit ? 'mounted' : 'unmounted'} · first event ${fire.firstEvent ?? '–'}`,
    )
  })
  lines.push(
    `pending  lowest raw pendingScrollUpdateCount ${record.pendingMin ?? '–'}${record.pendingMin != null && record.pendingMin < 0 ? ' (below 0: decremented twice)' : ''}`,
  )
  if (record.oscillation) {
    const osc = record.oscillation
    lines.push(
      `oscillation  ${describeOscillation(osc)} · offset − content ${fmt(osc.offsetMinusContent)} · began ${osc.sinceCommitMs != null ? `${osc.sinceCommitMs}ms after the commit` : '–'}${record.oscillatingAtStart ? ' · already running at start' : ''}`,
    )
  }
  if (record.jumps.length) lines.push(`jumps  ${record.jumps.join(', ')}`)
  if (record.mountTrail.length) {
    lines.push(`anchor  ${record.mountTrail.join(', ')}`)
  }
  for (const entry of record.vlTrail) lines.push(`VL  ${entry}`)
  return lines
}
