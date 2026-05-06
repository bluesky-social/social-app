import {
  applyPatch,
  buildGlobalRecord,
  fieldToTriState,
  mostRecentUpdatedAt,
  preferenceSetToTriStates,
  recordToTriStates,
} from './serde'
import {type AIPreferenceRecord} from './types'

describe('AI preferences serde', () => {
  describe('fieldToTriState', () => {
    it('maps undefined to "unset"', () => {
      expect(fieldToTriState(undefined)).toBe('unset')
    })
    it('maps allow:true to "allow"', () => {
      expect(fieldToTriState({allow: true})).toBe('allow')
    })
    it('maps allow:false to "deny"', () => {
      expect(fieldToTriState({allow: false})).toBe('deny')
    })
  })

  describe('preferenceSetToTriStates', () => {
    it('returns all "unset" for undefined input', () => {
      expect(preferenceSetToTriStates(undefined)).toEqual({
        training: 'unset',
        inference: 'unset',
        syntheticContent: 'unset',
        embedding: 'unset',
      })
    })

    it('maps a mixed set', () => {
      expect(
        preferenceSetToTriStates({
          training: {allow: false, updatedAt: '2026-05-05T00:00:00.000Z'},
          inference: {allow: true, updatedAt: '2026-05-05T00:00:00.000Z'},
        }),
      ).toEqual({
        training: 'deny',
        inference: 'allow',
        syntheticContent: 'unset',
        embedding: 'unset',
      })
    })
  })

  describe('recordToTriStates', () => {
    it('maps a null record to all "unset"', () => {
      expect(recordToTriStates(null)).toEqual({
        training: 'unset',
        inference: 'unset',
        syntheticContent: 'unset',
        embedding: 'unset',
      })
    })
  })

  describe('applyPatch', () => {
    const NOW = '2026-05-05T12:00:00.000Z'

    it('adds a new field with stamped updatedAt', () => {
      const next = applyPatch(undefined, {training: 'allow'}, NOW)
      expect(next).toEqual({training: {allow: true, updatedAt: NOW}})
    })

    it('flips an existing field and stamps updatedAt only on touched fields', () => {
      const prev = {
        training: {allow: true, updatedAt: '2026-01-01T00:00:00.000Z'},
        inference: {allow: false, updatedAt: '2026-02-01T00:00:00.000Z'},
      }
      const next = applyPatch(prev, {training: 'deny'}, NOW)
      expect(next.training).toEqual({allow: false, updatedAt: NOW})
      expect(next.inference).toEqual(prev.inference)
    })

    it('omits a category from the output when set to "unset" (does not write allow:false)', () => {
      const prev = {
        training: {allow: true, updatedAt: '2026-01-01T00:00:00.000Z'},
        inference: {allow: false, updatedAt: '2026-02-01T00:00:00.000Z'},
      }
      const next = applyPatch(prev, {training: 'unset'}, NOW)
      expect(next.training).toBeUndefined()
      expect('training' in next).toBe(false)
      expect(next.inference).toEqual(prev.inference)
    })

    it('ignores undefined entries in the patch', () => {
      const prev = {
        training: {allow: true, updatedAt: '2026-01-01T00:00:00.000Z'},
      }
      const next = applyPatch(prev, {inference: undefined}, NOW)
      expect(next).toEqual(prev)
    })
  })

  describe('buildGlobalRecord', () => {
    const NOW = '2026-05-05T12:00:00.000Z'

    it('produces a globalScope record with the correct $type and rkey-agnostic shape', () => {
      const record = buildGlobalRecord(null, {training: 'allow'}, NOW)
      expect(record.$type).toBe('community.lexicon.preference.ai')
      expect(record.scope).toEqual({
        $type: 'community.lexicon.preference.ai#globalScope',
      })
      expect(record.updatedAt).toBe(NOW)
      expect(record.preferences.training).toEqual({allow: true, updatedAt: NOW})
    })

    it('preserves untouched preferences from the previous record', () => {
      const prev: AIPreferenceRecord = {
        $type: 'community.lexicon.preference.ai',
        updatedAt: '2026-01-01T00:00:00.000Z',
        scope: {$type: 'community.lexicon.preference.ai#globalScope'},
        preferences: {
          training: {allow: true, updatedAt: '2026-01-01T00:00:00.000Z'},
          embedding: {allow: false, updatedAt: '2026-01-01T00:00:00.000Z'},
        },
      }
      const record = buildGlobalRecord(prev, {inference: 'deny'}, NOW)
      expect(record.preferences.training).toEqual(prev.preferences.training)
      expect(record.preferences.embedding).toEqual(prev.preferences.embedding)
      expect(record.preferences.inference).toEqual({
        allow: false,
        updatedAt: NOW,
      })
    })

    it('round-trips through recordToTriStates after a tri-state edit', () => {
      const r1 = buildGlobalRecord(null, {training: 'allow'}, NOW)
      const r2 = buildGlobalRecord(r1, {inference: 'deny'}, NOW)
      const r3 = buildGlobalRecord(r2, {training: 'unset'}, NOW)
      expect(recordToTriStates(r3)).toEqual({
        training: 'unset',
        inference: 'deny',
        syntheticContent: 'unset',
        embedding: 'unset',
      })
    })
  })

  describe('mostRecentUpdatedAt', () => {
    it('returns undefined for an empty set', () => {
      expect(mostRecentUpdatedAt({})).toBeUndefined()
      expect(mostRecentUpdatedAt(undefined)).toBeUndefined()
    })

    it('returns the latest field updatedAt', () => {
      expect(
        mostRecentUpdatedAt({
          training: {allow: true, updatedAt: '2026-01-01T00:00:00.000Z'},
          inference: {allow: false, updatedAt: '2026-03-01T00:00:00.000Z'},
          embedding: {allow: false, updatedAt: '2026-02-01T00:00:00.000Z'},
        }),
      ).toBe('2026-03-01T00:00:00.000Z')
    })
  })
})
