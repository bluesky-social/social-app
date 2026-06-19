import {describe, expect, it} from '@jest/globals'

import {
  didDocumentUrl,
  extractPdsEndpoint,
  looksLikeHandle,
} from '#/lib/api/pds-from-handle'

describe('extractPdsEndpoint', () => {
  it('returns the AtprotoPersonalDataServer endpoint when present', () => {
    const doc = {
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://eurosky.social',
        },
      ],
    }
    expect(extractPdsEndpoint(doc)).toBe('https://eurosky.social')
  })

  it('handles fully-qualified service ids (did-prefixed fragment)', () => {
    const doc = {
      service: [
        {
          id: 'did:plc:oio4hkxaop4ao4wz2pp3f4cr#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://shimeji.us-east.host.bsky.network',
        },
      ],
    }
    expect(extractPdsEndpoint(doc)).toBe(
      'https://shimeji.us-east.host.bsky.network',
    )
  })

  it('skips entries with the wrong type', () => {
    const doc = {
      service: [
        {
          id: '#atproto_pds',
          type: 'SomethingElse',
          serviceEndpoint: 'https://wrong.example',
        },
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://right.example',
        },
      ],
    }
    expect(extractPdsEndpoint(doc)).toBe('https://right.example')
  })

  it('returns null when there is no PDS service entry', () => {
    const doc = {
      service: [
        {
          id: '#atproto_labeler',
          type: 'AtprotoLabeler',
          serviceEndpoint: 'https://labeler.example',
        },
      ],
    }
    expect(extractPdsEndpoint(doc)).toBeNull()
  })

  it('returns null when service is missing', () => {
    expect(extractPdsEndpoint({})).toBeNull()
  })
})

describe('didDocumentUrl', () => {
  it('points did:plc at plc.directory', () => {
    expect(didDocumentUrl('did:plc:oio4hkxaop4ao4wz2pp3f4cr')).toBe(
      'https://plc.directory/did:plc:oio4hkxaop4ao4wz2pp3f4cr',
    )
  })

  it('points did:web at /.well-known/did.json on the host', () => {
    expect(didDocumentUrl('did:web:eurosky.social')).toBe(
      'https://eurosky.social/.well-known/did.json',
    )
  })

  it('points did:web with path at /path/did.json (no .well-known)', () => {
    expect(didDocumentUrl('did:web:example.com:user:alice')).toBe(
      'https://example.com/user/alice/did.json',
    )
  })

  it('returns null for unknown DID methods', () => {
    expect(didDocumentUrl('did:key:z6MkpTHR8...')).toBeNull()
    expect(didDocumentUrl('not-a-did')).toBeNull()
  })
})

describe('looksLikeHandle', () => {
  it.each([
    ['mackuba.eu', true],
    ['alice.bsky.social', true],
    ['  Foo.Bar.example  ', true],
  ])('treats %s as a handle', (input, expected) => {
    expect(looksLikeHandle(input)).toBe(expected)
  })

  it.each([
    ['alice', false], // single segment
    ['', false],
    ['  ', false],
    ['alice@example.com', false], // looks like email
    ['did:plc:abc', false],
    ['did:web:example.com', false],
  ])('does not treat %s as a handle', (input, expected) => {
    expect(looksLikeHandle(input)).toBe(expected)
  })
})
