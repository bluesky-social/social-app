import {describe, expect, it} from '@jest/globals'

import {type LinkFacetMatch, suggestLinkCardUri} from './text-input-util'

/*
 * `isValidUrlAndDomain` is module-private, so it is exercised here through its
 * only caller. In "suggest immediately" mode, suggestLinkCardUri returns a URI
 * iff it passes isValidUrlAndDomain, which lets us assert URL validity directly.
 */
function isValidUrl(uri: string): boolean {
  const next = new Map<string, LinkFacetMatch>([[uri, {} as LinkFacetMatch]])
  const result = suggestLinkCardUri(
    /*suggestLinkImmediately*/ true,
    next,
    new Map(),
    new Set(),
  )
  return result === uri
}

describe('isValidUrlAndDomain (via suggestLinkCardUri)', () => {
  describe('accepts', () => {
    it.each([
      'http://example.com',
      'https://example.com',
      'ftp://example.com',
      '//example.com',
      'https://example.com/',
      'https://example.com/path/to/page',
      'https://example.com/path?query=1#frag',
      'https://sub.example.co.uk',
      'https://example.com:8080',
      'https://example.com:8080/path',
      'https://user:pass@example.com',
      'https://user@example.com/path',
      'https://xn--80ak6aa92e.com',
      'https://münchen.de',
      'https://ex-ample.com',
      'https://a--b.example.com',
      'https://1.example.com',
      // public IPv4
      'http://8.8.8.8',
      'http://1.2.3.4',
      'http://223.255.255.254',
      'http://8.8.8.8:8080/path',
    ])('%s', uri => {
      expect(isValidUrl(uri)).toBe(true)
    })
  })

  describe('rejects private / reserved IPv4 ranges', () => {
    it.each([
      'http://10.0.0.1',
      'http://10.255.255.255',
      'http://127.0.0.1',
      'http://169.254.1.1',
      'http://192.168.0.1',
      'http://172.16.0.1',
      'http://172.31.255.255',
    ])('%s', uri => {
      expect(isValidUrl(uri)).toBe(false)
    })
  })

  describe('rejects out-of-range IPv4 octets', () => {
    it.each([
      'http://0.0.0.0', // first octet 0
      'http://224.0.0.1', // first octet > 223
      'http://999.1.1.1',
      'http://1.2.3.0', // last octet 0
      'http://1.2.3.255', // last octet 255
      'http://256.1.1.1',
      'http://1.2.3', // too few octets
      'http://1.2.3.4.5', // too many octets
    ])('%s', uri => {
      expect(isValidUrl(uri)).toBe(false)
    })
  })

  describe('rejects malformed input', () => {
    it.each([
      'example.com', // no protocol / no leading //
      'http:/example.com', // missing second slash
      'httpx://example.com', // unsupported scheme
      'gopher://example.com',
      'https://example', // bare TLD-less host
      'https://com', // single label
      'https://example.c', // TLD too short
      'https://-example.com', // leading hyphen
      'https://example-.com', // trailing hyphen
      'https://example.c0m', // digit in TLD
      'https://example..com', // empty label
      'https://example.com:1', // port too short
      'https://example.com:123456', // port too long
      'https://example.com:abc', // non-numeric port
      'https://exa mple.com', // whitespace
      'https://example.com/pa th', // whitespace in path
      'https://@example.com', // empty userinfo
      '',
      'https://',
    ])('%s', uri => {
      expect(isValidUrl(uri)).toBe(false)
    })
  })

  describe('ReDoS canaries return quickly', () => {
    it('rejects long "0." repetition without hanging', () => {
      expect(isValidUrl('//' + '0.'.repeat(50000))).toBe(false)
    })

    it('rejects long "00." repetition without hanging', () => {
      expect(isValidUrl('//0.' + '00.'.repeat(50000))).toBe(false)
    })
  })
})
