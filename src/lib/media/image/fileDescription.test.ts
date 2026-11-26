import {describe, expect, it} from '@jest/globals'

import {getAltFromFile} from '#/lib/media/image/altFromMetadata'
import {readFileDescriptions} from '#/lib/media/image/fileDescription'

const encoder = new TextEncoder()

function segment(marker: number, payload: Uint8Array): number[] {
  const length = payload.length + 2
  return [0xff, marker, length >> 8, length & 0xff, ...payload]
}

/** IFD0 with a single ImageDescription entry, big- or little-endian. */
function exifSegment(description: string, little = false): number[] {
  const text = [...encoder.encode(description), 0]
  const u16 = (n: number) => (little ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff])
  const u32 = (n: number) =>
    little
      ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24]
      : [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  // TIFF header (8) + entry count (2) + one entry (12) + next IFD (4) = 26
  const valueOffset = 26
  const value =
    text.length <= 4 ? [...text, 0, 0, 0, 0].slice(0, 4) : u32(valueOffset)
  const tiff = [
    ...(little ? [0x49, 0x49] : [0x4d, 0x4d]),
    ...u16(42),
    ...u32(8),
    ...u16(1),
    ...u16(0x010e),
    ...u16(2),
    ...u32(text.length),
    ...value,
    ...u32(0),
    ...(text.length > 4 ? text : []),
  ]
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0, 0]
  return segment(0xe1, new Uint8Array([...exifHeader, ...tiff]))
}

function xmpSegment(xml: string): number[] {
  const header = encoder.encode('http://ns.adobe.com/xap/1.0/\0')
  return segment(0xe1, new Uint8Array([...header, ...encoder.encode(xml)]))
}

function jpeg(...segments: number[][]): ArrayBuffer {
  const scan = [0xff, 0xda, 0, 2]
  return new Uint8Array([0xff, 0xd8, ...segments.flat(), ...scan]).buffer
}

function xmp(body: string): string {
  return `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description>${body}</rdf:Description></rdf:RDF></x:xmpmeta>`
}

describe('readFileDescriptions', () => {
  it('reads EXIF ImageDescription, big-endian', () => {
    expect(
      readFileDescriptions(jpeg(exifSegment('A red bicycle'))).imageDescription,
    ).toBe('A red bicycle')
  })

  it('reads EXIF ImageDescription, little-endian', () => {
    expect(
      readFileDescriptions(jpeg(exifSegment('Two cats', true)))
        .imageDescription,
    ).toBe('Two cats')
  })

  it('reads a short value stored inside the entry', () => {
    expect(
      readFileDescriptions(jpeg(exifSegment('Cat'))).imageDescription,
    ).toBe('Cat')
  })

  it('reads UTF-8 text', () => {
    expect(
      readFileDescriptions(jpeg(exifSegment('Pão de queijo na mesa')))
        .imageDescription,
    ).toBe('Pão de queijo na mesa')
  })

  it('reads the IPTC alt text and the description from XMP', () => {
    const result = readFileDescriptions(
      jpeg(
        xmpSegment(
          xmp(
            '<Iptc4xmpCore:AltTextAccessibility><rdf:Alt><rdf:li xml:lang="pt-BR">Um cachorro</rdf:li><rdf:li xml:lang="x-default">A dog &amp; a ball</rdf:li></rdf:Alt></Iptc4xmpCore:AltTextAccessibility>' +
              '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">Caption</rdf:li></rdf:Alt></dc:description>',
          ),
        ),
      ),
    )
    expect(result.altText).toBe('A dog & a ball')
    expect(result.description).toBe('Caption')
  })

  it('reads an XMP property written as an attribute', () => {
    expect(
      readFileDescriptions(
        jpeg(xmpSegment(xmp('<rdf:Description dc:description="Sunset" />'))),
      ).description,
    ).toBe('Sunset')
  })

  it('finds XMP outside a JPEG (PNG iTXt, WebP chunks)', () => {
    const png = encoder.encode(
      `\x89PNG\r\n\x1a\n...iTXtXML:com.adobe.xmp${xmp('<dc:description><rdf:Alt><rdf:li xml:lang="x-default">A chart</rdf:li></rdf:Alt></dc:description>')}`,
    )
    expect(readFileDescriptions(png.buffer).description).toBe('A chart')
  })

  it('returns nothing for files without metadata', () => {
    expect(readFileDescriptions(jpeg())).toEqual({
      altText: undefined,
      description: undefined,
      imageDescription: undefined,
    })
    expect(readFileDescriptions(new Uint8Array([1, 2, 3]).buffer)).toEqual({
      altText: undefined,
      description: undefined,
      imageDescription: undefined,
    })
  })

  it('stops on a truncated EXIF segment', () => {
    const broken = new Uint8Array(jpeg(exifSegment('A long description')))
    expect(
      readFileDescriptions(broken.slice(0, 30).buffer).imageDescription,
    ).toBeUndefined()
  })
})

describe('getAltFromFile', () => {
  it('prefers the IPTC alt text, then the XMP description, then EXIF', () => {
    const all = jpeg(
      exifSegment('From EXIF'),
      xmpSegment(
        xmp(
          '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">From XMP</rdf:li></rdf:Alt></dc:description>' +
            '<Iptc4xmpCore:AltTextAccessibility><rdf:Alt><rdf:li xml:lang="x-default">From IPTC</rdf:li></rdf:Alt></Iptc4xmpCore:AltTextAccessibility>',
        ),
      ),
    )
    expect(getAltFromFile(all)).toBe('From IPTC')
    expect(
      getAltFromFile(
        jpeg(
          exifSegment('From EXIF'),
          xmpSegment(
            xmp(
              '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">From XMP</rdf:li></rdf:Alt></dc:description>',
            ),
          ),
        ),
      ),
    ).toBe('From XMP')
    expect(getAltFromFile(jpeg(exifSegment('From EXIF')))).toBe('From EXIF')
  })

  it('skips camera placeholders', () => {
    expect(
      getAltFromFile(jpeg(exifSegment('OLYMPUS DIGITAL CAMERA'))),
    ).toBeUndefined()
  })
})
