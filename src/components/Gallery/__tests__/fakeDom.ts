/**
 * A minimal stand-in for the bits of the DOM the web handlers touch, so they
 * can be tested without a browser or jsdom. Only for tests.
 */

type Listener = ((e: FakeEvent) => void) & {original?: Listener}

export type FakeEvent = {
  type: string
  defaultPrevented: boolean
  timeStamp: number
  preventDefault: jest.Mock
  stopPropagation: jest.Mock
  [key: string]: unknown
}

export class FakeEventTarget {
  listeners = new Map<string, {fn: Listener; capture: boolean}[]>()

  addEventListener(
    type: string,
    fn: Listener,
    options?: boolean | {capture?: boolean; once?: boolean},
  ) {
    const capture = typeof options === 'object' ? !!options.capture : !!options
    const once = typeof options === 'object' && !!options.once
    const wrapped: Listener = once
      ? Object.assign(
          (e: FakeEvent) => {
            this.removeEventListener(type, wrapped, {capture})
            fn(e)
          },
          {original: fn},
        )
      : fn
    const list = this.listeners.get(type) ?? []
    list.push({fn: wrapped, capture})
    this.listeners.set(type, list)
  }

  removeEventListener(
    type: string,
    fn: Listener,
    options?: boolean | {capture?: boolean},
  ) {
    const capture = typeof options === 'object' ? !!options.capture : !!options
    const list = this.listeners.get(type) ?? []
    this.listeners.set(
      type,
      list.filter(
        l => !((l.fn === fn || l.fn.original === fn) && l.capture === capture),
      ),
    )
  }

  listenerCount(type: string) {
    return (this.listeners.get(type) ?? []).length
  }

  dispatch(type: string, event: Record<string, unknown> = {}) {
    const e: FakeEvent = {
      type,
      defaultPrevented: false,
      timeStamp: 0,
      preventDefault: jest.fn(() => {
        e.defaultPrevented = true
      }),
      stopPropagation: jest.fn(),
      ...event,
    }
    for (const {fn} of [...(this.listeners.get(type) ?? [])]) fn(e)
    return e
  }
}

export class FakeElement extends FakeEventTarget {
  style: Record<string, string> = {}
  children: FakeElement[] = []
  parentElement: FakeElement | null = null
  scrollLeft = 0
  scrollWidth = 1000
  clientWidth = 300
  isContentEditable = false
  attributes: Record<string, string> = {}

  constructor(public tagName = 'DIV') {
    super()
  }

  append(child: FakeElement) {
    child.parentElement = this
    this.children.push(child)
    return child
  }

  contains(node: FakeElement | null): boolean {
    for (let n = node; n; n = n.parentElement) {
      if (n === this) return true
    }
    return false
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null
  }

  closest(selector: string): FakeElement | null {
    const tags = selector.split(',').map(s => s.trim().toUpperCase())
    const find = (n: FakeElement | null): FakeElement | null =>
      n ? (tags.includes(n.tagName) ? n : find(n.parentElement)) : null
    return find(this)
  }

  blur = jest.fn()
  focus = jest.fn()
}

/**
 * Installs fake `window` and `document` globals. Returns the window and a
 * function to restore the originals.
 */
export function installFakeDom() {
  const g = globalThis as unknown as Record<string, unknown>
  const original = {
    window: g.window,
    document: g.document,
    raf: g.requestAnimationFrame,
    caf: g.cancelAnimationFrame,
  }
  const fakeWindow = new FakeEventTarget() as FakeEventTarget & {
    getSelection: () => {removeAllRanges: jest.Mock}
  }
  const selection = {removeAllRanges: jest.fn()}
  fakeWindow.getSelection = () => selection
  const body = new FakeElement('BODY')
  const fakeDocument = {activeElement: body as FakeElement | null, body}
  g.window = fakeWindow
  g.document = fakeDocument
  // Hold animation frames so tweens start but never tick
  const frames: ((t: number) => void)[] = []
  g.requestAnimationFrame = jest.fn((cb: (t: number) => void) => {
    frames.push(cb)
    return frames.length
  })
  g.cancelAnimationFrame = jest.fn((id: number) => {
    frames[id - 1] = () => {}
  })
  let flushed = 0
  const flushFrames = (step = 100, max = 200) => {
    for (let t = 0; flushed < frames.length && t / step < max; t += step) {
      frames[flushed++](t)
    }
  }
  return {
    window: fakeWindow,
    document: fakeDocument,
    selection,
    frames,
    /** Runs every held animation frame, and any scheduled by those */
    flushFrames,
    restore() {
      g.window = original.window
      g.document = original.document
      g.requestAnimationFrame = original.raf
      g.cancelAnimationFrame = original.caf
    },
  }
}
