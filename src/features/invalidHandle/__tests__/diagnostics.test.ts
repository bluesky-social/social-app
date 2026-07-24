import {describe, expect, it} from '@jest/globals'

import {
  extractIntendedHandle,
  isServiceHandle,
  pickDiagnosis,
} from '../diagnostics'
import {type DiagnosisInputs} from '../types'

const DID = 'did:plc:abc123'
const OTHER_DID = 'did:plc:someoneelse'
const HANDLE = 'alice.example.com'

describe('extractIntendedHandle', () => {
  it('extracts the handle from an at:// alsoKnownAs entry', () => {
    expect(extractIntendedHandle({alsoKnownAs: [`at://${HANDLE}`]})).toBe(
      HANDLE,
    )
  })

  it('skips non-at:// entries', () => {
    expect(
      extractIntendedHandle({
        alsoKnownAs: ['https://example.com', `at://${HANDLE}`],
      }),
    ).toBe(HANDLE)
  })

  it('returns undefined when alsoKnownAs is missing or empty', () => {
    expect(extractIntendedHandle({})).toBeUndefined()
    expect(extractIntendedHandle({alsoKnownAs: []})).toBeUndefined()
    expect(extractIntendedHandle(undefined)).toBeUndefined()
    expect(extractIntendedHandle(null)).toBeUndefined()
    expect(extractIntendedHandle('not an object')).toBeUndefined()
  })

  it('rejects entries that do not look like a handle', () => {
    expect(
      extractIntendedHandle({alsoKnownAs: ['at://nodots']}),
    ).toBeUndefined()
  })

  it('ignores non-string entries', () => {
    expect(
      extractIntendedHandle({alsoKnownAs: [42, null, `at://${HANDLE}`]}),
    ).toBe(HANDLE)
  })
})

describe('isServiceHandle', () => {
  it('matches handles under an available user domain', () => {
    expect(isServiceHandle('alice.bsky.social', ['.bsky.social'])).toBe(true)
  })

  it('handles domains without a leading dot', () => {
    expect(isServiceHandle('alice.bsky.social', ['bsky.social'])).toBe(true)
  })

  it('does not match custom domains', () => {
    expect(isServiceHandle(HANDLE, ['.bsky.social'])).toBe(false)
  })

  it('does not match the bare domain itself', () => {
    expect(isServiceHandle('bsky.social', ['bsky.social'])).toBe(false)
  })

  it('returns false with no domains', () => {
    expect(isServiceHandle(HANDLE, [])).toBe(false)
  })
})

describe('pickDiagnosis', () => {
  const base: DiagnosisInputs = {
    expectedDid: DID,
    didDoc: {status: 'ok', intendedHandle: HANDLE},
    isServiceHandle: false,
  }

  it('reports network-unavailable when the DID doc fetch failed on network', () => {
    expect(pickDiagnosis({...base, didDoc: {status: 'network-error'}})).toEqual(
      {type: 'network-unavailable'},
    )
  })

  it('reports inconclusive when the DID doc fetch failed otherwise', () => {
    expect(pickDiagnosis({...base, didDoc: {status: 'error'}})).toEqual({
      type: 'inconclusive',
    })
  })

  it('reports no-aka-handle when the DID doc has no handle', () => {
    expect(
      pickDiagnosis({
        ...base,
        didDoc: {status: 'ok', intendedHandle: undefined},
      }),
    ).toEqual({type: 'no-aka-handle'})
  })

  it('reports resolves-correctly when resolution matches the expected DID', () => {
    expect(
      pickDiagnosis({...base, resolution: {status: 'resolved', did: DID}}),
    ).toEqual({type: 'resolves-correctly', handle: HANDLE})
  })

  it('reports wrong-did when resolution returns another DID', () => {
    expect(
      pickDiagnosis({
        ...base,
        resolution: {status: 'resolved', did: OTHER_DID},
      }),
    ).toEqual({type: 'wrong-did', handle: HANDLE, found: OTHER_DID})
  })

  it('a correct resolution beats the service handle check', () => {
    expect(
      pickDiagnosis({
        ...base,
        isServiceHandle: true,
        resolution: {status: 'resolved', did: DID},
      }),
    ).toEqual({type: 'resolves-correctly', handle: HANDLE})
  })

  it('reports service-handle-issue over not-resolving for service handles', () => {
    expect(
      pickDiagnosis({
        ...base,
        isServiceHandle: true,
        resolution: {status: 'not-resolving'},
      }),
    ).toEqual({type: 'service-handle-issue', handle: HANDLE})
  })

  it('reports not-resolving when the server cannot resolve the handle', () => {
    expect(
      pickDiagnosis({...base, resolution: {status: 'not-resolving'}}),
    ).toEqual({type: 'not-resolving', handle: HANDLE})
  })

  it('reports network-unavailable when resolution failed on network', () => {
    expect(
      pickDiagnosis({...base, resolution: {status: 'network-error'}}),
    ).toEqual({type: 'network-unavailable'})
  })

  it('falls through to inconclusive on unexpected resolution errors', () => {
    expect(pickDiagnosis({...base, resolution: {status: 'error'}})).toEqual({
      type: 'inconclusive',
      handle: HANDLE,
    })
  })

  it('falls through to inconclusive when resolution never ran', () => {
    expect(pickDiagnosis({...base})).toEqual({
      type: 'inconclusive',
      handle: HANDLE,
    })
  })
})
