import {describe, expect, test} from '@jest/globals'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {renderHook} from '@testing-library/react-native'

import {
  type UploadPhase,
  usePlanErrorHint,
  useThreadgateSummary,
  useUploadPhaseLabel,
} from '#/view/screens/DebugComposer/messages'
import {type ComposerV2PlanErrorCode} from '#/components/ComposerV2/planner'

/*
 * Regression coverage for the Lingui macro-binding bug: these hooks used to
 * be plain functions taking the macro alias as a parameter, which left their
 * tagged templates uncompiled and rendered empty strings at runtime (on iOS
 * the gate summary showed only " · quotes allowed"). The hooks are rendered
 * here against a real Lingui runtime with an empty catalog, so every branch
 * must produce its non-empty English fallback exactly.
 */

const i18n = setupI18n({locale: 'en', messages: {en: {}}})

function wrapper({children}: {children: React.ReactNode}) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

/** Typecheck-enforced exhaustive list of planner error codes. */
const ALL_PLAN_ERROR_CODES = Object.keys({
  'missing-dependency': true,
  'invalid-snapshot': true,
  'empty-composition': true,
  'empty-post-requires-confirmation': true,
  'missing-alt-text': true,
  'attachment-not-ready': true,
  'media-failed': true,
  'unsupported-attachment': true,
  'reply-resolution-failed': true,
  'rich-text-resolution-failed': true,
  'media-upload-failed': true,
  'invalid-record-key': true,
  'invalid-record': true,
  'invalid-write-input': true,
  'unexpected-error': true,
} satisfies Record<ComposerV2PlanErrorCode, true>) as ComposerV2PlanErrorCode[]

/** Typecheck-enforced exhaustive list of upload phases. */
const ALL_UPLOAD_PHASES = Object.keys({
  validating: true,
  compressing: true,
  uploading: true,
  processing: true,
  captions: true,
} satisfies Record<UploadPhase, true>) as UploadPhase[]

describe('useThreadgateSummary', () => {
  test('renders a translated, non-empty summary for every settings shape', () => {
    const {result} = renderHook(() => useThreadgateSummary(), {wrapper})
    const summarize = result.current

    expect(summarize([{type: 'everybody'}])).toBe('replies: everybody')
    expect(summarize([{type: 'nobody'}])).toBe('replies: nobody')
    expect(summarize([])).toBe('replies: unknown rules only')
    expect(summarize([{type: 'mention'}, {type: 'followers'}])).toBe(
      'replies: mentioned, followers',
    )
    expect(
      summarize([
        {type: 'following'},
        {type: 'list', list: 'at://did:plc:abc/app.bsky.graph.list/rkey'},
      ]),
    ).toBe('replies: following, list')
  })
})

describe('usePlanErrorHint', () => {
  test('renders a translated, non-empty hint for every planner error code', () => {
    const {result} = renderHook(() => usePlanErrorHint(), {wrapper})
    const hint = result.current

    for (const code of ALL_PLAN_ERROR_CODES) {
      const text = hint(code)
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toContain('undefined')
    }
    /* Spot-check exact fallback output for a representative branch. */
    expect(hint('empty-composition')).toBe(
      'Add text, tags, or an attachment to at least one post.',
    )
  })
})

describe('useUploadPhaseLabel', () => {
  test('renders a translated, non-empty label for every upload phase', () => {
    const {result} = renderHook(() => useUploadPhaseLabel(), {wrapper})
    const label = result.current

    for (const phase of ALL_UPLOAD_PHASES) {
      const text = label(phase)
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(0)
    }
    expect(label('captions')).toBe('Uploading captions')
  })
})
