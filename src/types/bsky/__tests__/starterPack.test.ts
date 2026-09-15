/* Full schema matching exercises CID validation, so use the real CID parser. */
jest.unmock('multiformats/cid')

import {app} from '#/lexicons'
import {
  type AnyStarterPackView,
  isBasicView,
  isTrustedView,
  isView,
} from '#/types/bsky/starterPack'

const now = () => new Date().toISOString()

const creator = {
  $type: 'app.bsky.actor.defs#profileViewBasic',
  did: 'did:plc:qrllvid7s54k4hnwtqxwetrf',
  handle: 'joshuajfriedman.com',
}

const basicView = {
  $type: 'app.bsky.graph.defs#starterPackViewBasic',
  uri: 'at://did:plc:qrllvid7s54k4hnwtqxwetrf/app.bsky.graph.starterpack/3l4poszxde32k',
  cid: 'bafyreiaxduxpwdpjgvve3klfs4flkwjwfqiurszw4o6jvjarpqqmeqwiza',
  record: {
    $type: 'app.bsky.graph.starterpack',
    createdAt: '2024-09-22T03:52:03.686Z',
    feeds: [],
    list: 'at://did:plc:qrllvid7s54k4hnwtqxwetrf/app.bsky.graph.list/3l4posztwzy2e',
    name: 'Bluesky for Art History',
  },
  creator,
  indexedAt: now(),
}

const fullView = {
  ...basicView,
  $type: 'app.bsky.graph.defs#starterPackView',
}

const {$type: _, ...directFullView} = fullView

const syntheticFullView = {
  ...fullView,
  list: {
    uri: 'at://did:plc:abc/app.bsky.graph.list/123',
    cid: '',
    name: 'Starter Pack',
    purpose: 'app.bsky.graph.defs#referencelist',
  },
}

/*
 * Type-level assertions for the view alias: it must accept both the basic and
 * the full Starter Pack view. Compile-time only - a failure surfaces as a
 * typecheck error.
 */
type Assignable<From, To> = From extends To ? true : false
type Expect<T extends true> = T

type _AcceptsBasicView = Expect<
  Assignable<app.bsky.graph.defs.StarterPackViewBasic, AnyStarterPackView>
>
type _AcceptsFullView = Expect<
  Assignable<app.bsky.graph.defs.StarterPackView, AnyStarterPackView>
>

describe('types/bsky/starterPack guards', () => {
  describe('isBasicView', () => {
    it('accepts a basic view', () => {
      expect(isBasicView(basicView)).toBe(true)
    })

    it('rejects the full view', () => {
      expect(isBasicView(fullView)).toBe(false)
    })

    it('rejects a missing or absent $type', () => {
      expect(isBasicView({uri: 'at://x', cid: 'y'})).toBe(false)
      expect(isBasicView(null)).toBe(false)
      expect(isBasicView(undefined)).toBe(false)
      expect(isBasicView('string')).toBe(false)
    })
  })

  describe('isView', () => {
    it('accepts the full view', () => {
      expect(isView(fullView)).toBe(true)
    })

    it('rejects the basic view', () => {
      expect(isView(basicView)).toBe(false)
    })

    it('rejects a missing or absent $type', () => {
      expect(isView({uri: 'at://x', cid: 'y'})).toBe(false)
      expect(isView(null)).toBe(false)
      expect(isView(undefined)).toBe(false)
    })
  })

  describe('isTrustedView', () => {
    it('accepts a direct full view with an omitted $type', () => {
      expect(isTrustedView(directFullView)).toBe(true)
    })

    it('accepts a typed synthetic view with placeholder fields', () => {
      expect(
        app.bsky.graph.defs.starterPackView.matches(syntheticFullView),
      ).toBe(false)
      expect(isTrustedView(syntheticFullView)).toBe(true)
    })

    it('rejects the basic view', () => {
      expect(isTrustedView(basicView)).toBe(false)
    })
  })

  it('narrows a view from either world to a readable shape', () => {
    /*
     * The `$type` string is world-independent, so one guard narrows values from
     * both producers; the narrowed union stays structurally readable.
     */
    for (const view of [basicView, fullView]) {
      if (isBasicView(view) || isView(view)) {
        expect(typeof view.uri).toBe('string')
        expect(typeof view.creator.did).toBe('string')
      }
    }
  })
})
