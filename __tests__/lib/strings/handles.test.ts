import {toASCII} from 'punycode'

import {forceLTR} from '#/lib/strings/bidi'
import {getPartitionIndex,sanitizeHandle} from '#/lib/strings/handles'

describe('User handle sanitization', () => {
  it('accepts basic ascii handles', () => {
    expect(sanitizeHandle('foo.example.tld')).toStrictEqual(
      forceLTR('foo.example.tld'),
    )
    expect(sanitizeHandle('foo.bsky.social')).toStrictEqual(
      forceLTR('foo.bsky.social'),
    )
    expect(sanitizeHandle('foo-bar.bsky.social', '@')).toStrictEqual(
      forceLTR('@foo-bar.bsky.social'),
    )
  })

  it('detects invalid handles', () => {
    expect(sanitizeHandle('handle.invalid')).toStrictEqual('⚠Invalid Handle')
    expect(sanitizeHandle('handle.invalid', '@')).toStrictEqual(
      '⚠Invalid Handle',
    )
    expect(sanitizeHandle('handle.invalid', '@', true)).toStrictEqual(
      '⚠Invalid Handle',
    )
    expect(sanitizeHandle('handle.invalid', '@', false)).toStrictEqual(
      '⚠Invalid Handle',
    )
  })

  it('accepts IDN handles from ASCII TLDs', () => {
    // IDN domain
    expect(sanitizeHandle('xn--e1aaakybcbhrmi4dyd.tld')).toStrictEqual(
      forceLTR('оченьинтересно.tld'),
    )
    expect(
      sanitizeHandle('xn--e1aaakybcbhrmi4dyd.tld', '', false),
    ).toStrictEqual(forceLTR('xn--e1aaakybcbhrmi4dyd.tld'))
    // IDN domain (emoji)
    expect(sanitizeHandle('xn--g28haa.ws')).toStrictEqual(
      forceLTR('\u{1f602}\u{1f602}\u{1f602}.ws'),
    )
    expect(sanitizeHandle('xn--g28haa.ws', '@', false)).toStrictEqual(
      forceLTR('@xn--g28haa.ws'),
    )
    // IDN subdomain (emoji)
    expect(sanitizeHandle('xn--w28h.example.com', '@')).toStrictEqual(
      forceLTR('@\u{1f612}.example.com'),
    )
    expect(sanitizeHandle('xn--w28h.example.com', '', false)).toStrictEqual(
      forceLTR('xn--w28h.example.com'),
    )
  })

  it('accepts IDN handles from IDN TLDs', () => {
    // IDN domain
    expect(sanitizeHandle('xn-----olca5bbzc5b1a.xn--p1ai')).toStrictEqual(
      forceLTR('что-то-еще.рф'),
    )
    expect(
      sanitizeHandle('xn-----olca5bbzc5b1a.xn--p1ai', '', false),
    ).toStrictEqual(forceLTR('xn-----olca5bbzc5b1a.xn--p1ai'))
    expect(
      sanitizeHandle('xn----0tdd2fya8ala5a2eaz8g2amjt4ixf.xn--h2brj9c', '@'),
    ).toStrictEqual(forceLTR('@वेबडिज़ाइननई-दिल्ली.भारत'))
    expect(
      sanitizeHandle(
        'xn--___-sehg1j8a7bob1b8ea3a3i6aokv6j6f.xn--h2brj9c',
        '@',
        false,
      ),
    ).toStrictEqual(
      forceLTR('@xn--___-sehg1j8a7bob1b8ea3a3i6aokv6j6f.xn--h2brj9c'),
    )
    // ASCII domain
    expect(sanitizeHandle('example-nonprofit.xn--nqv7fs00ema')).toStrictEqual(
      forceLTR('example-nonprofit.组织机构'),
    )
    expect(
      sanitizeHandle('example-nonprofit.xn--nqv7fs00ema', '', false),
    ).toStrictEqual(forceLTR('example-nonprofit.xn--nqv7fs00ema'))
  })

  it('rejects IDN handles that mix combining diacritics (U+0300 to U+036F) in different scripts', () => {
    // "hospital" in Greek, but we added a Combining Overline to the last letter,
    // and that combining character's scripts (Copt Elba Glag Goth Kana Latn) do not have Greek (Grek),
    const unicodeDomain = 'νοσοκομείο\u0305.tld'
    const asciiDomain = toASCII(unicodeDomain)
    expect(asciiDomain.startsWith('xn--')).toBe(true)
    expect(unicodeDomain).toStrictEqual(unicodeDomain.normalize('NFC'))
    const displayedDomain = sanitizeHandle(asciiDomain)
    expect(displayedDomain).toStrictEqual(forceLTR(asciiDomain))
  })

  it('rejects IDN handles that use Latin confusable characters', () => {
    // Greek 'ν' + Latin 'ersace'
    expect(sanitizeHandle('xn--ersace-2ze.com')).toStrictEqual(
      forceLTR('xn--ersace-2ze.com'),
    )
    // Cyrillic 'a' + Latin 'pple'
    expect(sanitizeHandle('xn--pple-43d.com')).toStrictEqual(
      forceLTR('xn--pple-43d.com'),
    )
    // Latin 'example' with 'm' replaced by the Armenian Small Letter Turned Ayb (U+0560)
    expect(sanitizeHandle('xn--exaple-yeh.com')).toStrictEqual(
      forceLTR('xn--exaple-yeh.com'),
    )
  })

  it('rejects IDN handles that are not in NFC form', () => {
    // Latin 'a' with circumflex (NFC)
    const composedForm = 'b\u00e2timent.fr'
    // Latin 'a' + combining circumflex (NFD)
    const decomposedForm = 'ba\u0302timent.fr'
    // The strings are not equal, but will display the same way
    expect(composedForm).not.toStrictEqual(decomposedForm)

    const composedFormAscii = toASCII(composedForm)
    // it displays in unicode
    expect(sanitizeHandle(composedFormAscii)).toStrictEqual(
      forceLTR(composedForm),
    )

    // it displays in ascii
    const decomposedFormAscii = toASCII(decomposedForm)
    expect(sanitizeHandle(decomposedFormAscii)).toStrictEqual(
      forceLTR(decomposedFormAscii),
    )
  })
})

describe('getPartitionIndex(array, x)', () => {
  it('finds the index in the middle', () => {
    let partitionsEnds = [10, 20, 30]
    expect(getPartitionIndex(partitionsEnds, 21)).toBe(2)
  })

  it('finds the right index', () => {
    let partitionsEnds = [10, 20, 30, 40]
    expect(getPartitionIndex(partitionsEnds, 15)).toBe(1)
  })

  it('returns -1 when x is not in the partitions', () => {
    let partitionsEnds = [10, 20, 30, 40]
    expect(getPartitionIndex(partitionsEnds, 41)).toBe(-1)
  })

  it('returns 0 when x is in the first partition', () => {
    let partitionsEnds = [10, 20, 30, 40]
    expect(getPartitionIndex(partitionsEnds, 0)).toBe(0)
  })
})
