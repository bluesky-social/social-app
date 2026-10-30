import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

const now = () => new Date().toISOString()

/**
 * A structurally valid `app.bsky.feed.post` record.
 */
const validPost = {
  $type: 'app.bsky.feed.post',
  text: 'hello world',
  createdAt: now(),
}

/**
 * Right `$type`, but the body is invalid (`text` is not a string, `createdAt`
 * is not a datetime). Passes a `$type`-only guard, fails full validation.
 */
const invalidPost = {
  $type: 'app.bsky.feed.post',
  text: 123,
  createdAt: 'not-a-datetime',
}

/**
 * A different record type entirely - should fail even the fast guard.
 */
const wrongType = {
  $type: 'app.bsky.feed.like',
  subject: {uri: 'at://x', cid: 'y'},
  createdAt: now(),
}

describe('types/bsky lexicon schema helpers (#/lexicons)', () => {
  describe('isType (fast, $type-only)', () => {
    it('accepts a valid record', () => {
      expect(bsky.isType(app.bsky.feed.post, validPost)).toBe(true)
    })

    it('rejects a $type mismatch', () => {
      expect(bsky.isType(app.bsky.feed.post, wrongType)).toBe(false)
    })

    it('accepts an invalid body that has the right $type (dangerous semantics)', () => {
      /*
       * Mirrors `dangerousIsType`: only the `$type` is checked, so a
       * structurally invalid record still passes.
       */
      expect(bsky.isType(app.bsky.feed.post, invalidPost)).toBe(true)
    })

    it('rejects a record with no $type at all', () => {
      expect(
        bsky.isType(app.bsky.feed.post, {text: 'hi', createdAt: now()}),
      ).toBe(false)
    })

    it('accepts a schema passed as its namespace module or its main schema', () => {
      expect(bsky.isType(app.bsky.feed.post, validPost)).toBe(true)
      expect(bsky.isType(app.bsky.feed.post.main, validPost)).toBe(true)
    })

    it('returns false (does not throw) for null, undefined and non-objects', () => {
      /*
       * Mirrors the `dangerousIsType`/`is$typed` behavior - call sites pass
       * e.g. `post.record` which may be undefined.
       */
      expect(bsky.isType(app.bsky.feed.post, null)).toBe(false)
      expect(bsky.isType(app.bsky.feed.post, undefined)).toBe(false)
      expect(bsky.isType(app.bsky.feed.post, 'string')).toBe(false)
    })

    it('requires a present $type for typed-object def schemas', () => {
      /*
       * The generated TypedObjectSchema.isTypeOf treats a missing $type as a
       * match (maybe-typed semantics). Our helper must NOT: when
       * discriminating unions by $type, an object without $type would
       * otherwise satisfy every branch.
       */
      expect(bsky.isType(app.bsky.feed.defs.postView, {foo: 1})).toBe(false)
      expect(bsky.isType(app.bsky.feed.defs.postView, {})).toBe(false)
      expect(
        bsky.isType(app.bsky.feed.defs.postView, {
          $type: 'app.bsky.feed.defs#postView',
        }),
      ).toBe(true)
    })

    it('rejects what the schema own isTypeOf would accept or throw on', () => {
      /*
       * Pins the upstream behavior that justifies the hand-rolled check in
       * `isType`. If either of these expectations starts failing, upstream has
       * changed and `isType` can consider delegating to `isTypeOf`.
       */
      expect(app.bsky.feed.defs.postView.isTypeOf({})).toBe(true)
      expect(() =>
        app.bsky.feed.post.main.isTypeOf(
          null as unknown as {$type?: 'app.bsky.feed.post'},
        ),
      ).toThrow()
    })
  })

  describe('matches (full validation guard)', () => {
    it('accepts a valid record', () => {
      expect(bsky.matches(app.bsky.feed.post, validPost)).toBe(true)
    })

    it('accepts a schema passed as its namespace module or its main schema', () => {
      expect(bsky.matches(app.bsky.feed.post, validPost)).toBe(true)
      expect(bsky.matches(app.bsky.feed.post.main, validPost)).toBe(true)
    })

    it('rejects a $type mismatch', () => {
      expect(bsky.matches(app.bsky.feed.post, wrongType)).toBe(false)
    })

    it('rejects an invalid body even though the $type matches', () => {
      expect(bsky.matches(app.bsky.feed.post, invalidPost)).toBe(false)
    })

    it('rejects null and undefined', () => {
      expect(bsky.matches(app.bsky.feed.post, null)).toBe(false)
      expect(bsky.matches(app.bsky.feed.post, undefined)).toBe(false)
    })
  })

  describe('safeParse (full validation, no throw)', () => {
    it('succeeds and returns the value for a valid record', () => {
      const result = bsky.safeParse(app.bsky.feed.post, validPost)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.text).toBe('hello world')
      }
    })

    it('fails with a reason for an invalid record', () => {
      const result = bsky.safeParse(app.bsky.feed.post, invalidPost)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBeDefined()
      }
    })

    it('accepts a schema passed as its main schema', () => {
      const result = bsky.safeParse(app.bsky.feed.post.main, validPost)
      expect(result.success).toBe(true)
    })
  })

  describe('parse (full validation, throws)', () => {
    it('returns the typed value for a valid record', () => {
      const record = bsky.parse(app.bsky.feed.post, validPost)
      expect(record.text).toBe('hello world')
    })

    it('throws for an invalid record', () => {
      expect(() => bsky.parse(app.bsky.feed.post, invalidPost)).toThrow()
    })

    it('accepts a schema passed as its main schema', () => {
      expect(bsky.parse(app.bsky.feed.post.main, validPost).text).toBe(
        'hello world',
      )
    })
  })
})
