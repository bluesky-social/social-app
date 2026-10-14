import {RichText as RichTextAPI, UnicodeString} from '@bsky/sdk/richtext'
import {
  type CompileContext,
  type Extension,
  fromMarkdown,
} from 'mdast-util-from-markdown'

export type CodeRegion = {
  type: 'block' | 'inline'
  /** Original UTF-8 byte offsets, including code delimiters. */
  start: number
  /** Exclusive end of the complete code envelope. */
  end: number
  /** Reconstructed block payload or the unchanged inline interior, for Copy. */
  code: string
  /** CommonMark normalization is used only for display. */
  displayCode: string
  lang?: string
}

export type RichTextCodeSegment =
  {type: 'text'; richText: RichTextAPI} | CodeRegion

/* Indented code recognition also enforces the indentation limit for fences. */
const disabledConstructs = [
  'attention',
  'headingAtx',
  'setextUnderline',
  'htmlFlow',
  'htmlText',
  'autolink',
  'labelStartLink',
  'labelStartImage',
  'labelEnd',
  'definition',
  'thematicBreak',
  'hardBreakEscape',
]

/**
 * Recognize code on the complete source before facets or presentation alter it.
 * Observers retain body line endings that the mdast code value omits.
 */
export function parseCodeRegions(text: string): CodeRegion[] {
  if (!text.includes('`') && !text.includes('~')) return []

  const unicodeText = new UnicodeString(text)
  const bomOffset = text.startsWith('\uFEFF') ? 1 : 0
  const regions: CodeRegion[] = []
  const byPosition = new Map<string, CodeRegion>()
  let block:
    | {
        copyParts: string[]
        displayParts: string[]
        skipHeaderEnding: boolean
        start: number
      }
    | undefined
  let inline: {bodyStart?: number; bodyEnd?: number} | undefined

  const observer: Extension = {
    beforeEnter(token) {
      if (token.type === 'codeFenced') {
        const offset = token.start.offset + bomOffset
        /*
         * Quote/list prefixes belong to the panel's opening line, rather than
         * becoming orphaned prose when the container is flattened for display.
         */
        const lineStart =
          Math.max(
            text.lastIndexOf('\n', offset - 1),
            text.lastIndexOf('\r', offset - 1),
          ) + 1
        block = {
          copyParts: [],
          displayParts: [],
          skipHeaderEnding: true,
          start: lineStart,
        }
      } else if (token.type === 'codeText') {
        inline = {}
      }
    },
    afterExit(this: CompileContext, token) {
      if (block) {
        if (token.type === 'codeFlowValue') {
          const serialized = this.sliceSerialize(token)
          const raw = text.slice(
            token.start.offset + bomOffset,
            token.end.offset + bomOffset,
          )
          /*
           * Preserve source NULs for Copy. The serializer also supplies leading
           * spaces left by partially consumed structural tabs.
           */
          block.copyParts.push(
            serialized.slice(0, serialized.length - raw.length) + raw,
          )
          block.displayParts.push(serialized)
        } else if (token.type === 'lineEnding') {
          if (block.skipHeaderEnding) {
            block.skipHeaderEnding = false
          } else {
            const ending = this.sliceSerialize(token)
            block.copyParts.push(ending)
            block.displayParts.push(ending)
          }
        } else if (token.type === 'codeFenced') {
          const region: CodeRegion = {
            type: 'block',
            start: unicodeText.utf16IndexToUtf8Index(block.start),
            end: unicodeText.utf16IndexToUtf8Index(
              token.end.offset + bomOffset,
            ),
            code: block.copyParts.join(''),
            displayCode: block.displayParts.join(''),
          }
          regions.push(region)
          byPosition.set(`${token.start.offset}:${token.end.offset}`, region)
          block = undefined
        }
      } else if (inline) {
        if (token.type === 'codeTextSequence') {
          if (inline.bodyStart === undefined) {
            inline.bodyStart = token.end.offset + bomOffset
          } else {
            inline.bodyEnd = token.start.offset + bomOffset
          }
        } else if (token.type === 'codeText') {
          const code = text.slice(inline.bodyStart, inline.bodyEnd)
          const region: CodeRegion = {
            type: 'inline',
            start: unicodeText.utf16IndexToUtf8Index(
              token.start.offset + bomOffset,
            ),
            end: unicodeText.utf16IndexToUtf8Index(
              token.end.offset + bomOffset,
            ),
            code,
            displayCode: code,
          }
          regions.push(region)
          byPosition.set(`${token.start.offset}:${token.end.offset}`, region)
          inline = undefined
        }
      }
    },
  }

  const tree = fromMarkdown(text, {
    extensions: [{disable: {null: disabledConstructs}}],
    mdastExtensions: [observer],
  })
  const nodes = [...tree.children]
  while (nodes.length) {
    const node = nodes.pop()!
    if (node.type === 'code' || node.type === 'inlineCode') {
      const region = byPosition.get(
        `${node.position?.start.offset}:${node.position?.end.offset}`,
      )
      if (region) {
        if (node.type === 'code' && node.lang) {
          region.lang = node.lang
        } else if (node.type === 'inlineCode') {
          /* mdast retains physical line endings in the inline code value. */
          region.displayCode = node.value.replace(/\r\n?|\n/g, ' ')
        }
      }
    } else if ('children' in node) {
      nodes.push(...node.children)
    }
  }

  return regions.sort((left, right) => left.start - right.start)
}

/**
 * Overlay SDK facets on source gaps while keeping any facet touching code
 * wholly literal. The original RichText and its facet objects are untouched.
 */
export function segmentRichTextCode(richText: RichTextAPI): {
  segments: RichTextCodeSegment[]
  filteredRichText: RichTextAPI
} {
  const regions = parseCodeRegions(richText.text)
  if (!regions.length) {
    return {
      segments: [{type: 'text', richText}],
      filteredRichText: richText,
    }
  }

  const validRichText = richText.clone()
  const bytes = richText.unicodeText.utf8
  const decoder = new TextDecoder('utf-8', {ignoreBOM: true})
  const isBoundary = (offset: number) =>
    offset === bytes.length || (bytes[offset] & 0xc0) !== 0x80
  validRichText.facets = validRichText.facets?.filter(({index}) => {
    const {byteStart, byteEnd} = index
    return (
      Number.isSafeInteger(byteStart) &&
      Number.isSafeInteger(byteEnd) &&
      byteStart >= 0 &&
      byteStart < byteEnd &&
      byteEnd <= bytes.length &&
      isBoundary(byteStart) &&
      isBoundary(byteEnd)
    )
  })

  const facets = [...validRichText.segments()]
    .flatMap(segment => (segment.facet ? [segment.facet] : []))
    .filter(
      facet =>
        !regions.some(
          region =>
            facet.index.byteStart < region.end &&
            facet.index.byteEnd > region.start,
        ),
    )
  const filteredRichText = new RichTextAPI({text: richText.text, facets})
  const segments: RichTextCodeSegment[] = []
  let cursor = 0

  const appendText = (start: number, end: number) => {
    if (start === end) return
    segments.push({
      type: 'text',
      richText: new RichTextAPI({
        text: decoder.decode(bytes.subarray(start, end)),
        facets: facets
          .filter(
            facet =>
              facet.index.byteStart >= start && facet.index.byteEnd <= end,
          )
          .map(facet => ({
            ...facet,
            index: {
              ...facet.index,
              byteStart: facet.index.byteStart - start,
              byteEnd: facet.index.byteEnd - start,
            },
          })),
      }),
    })
  }

  for (const region of regions) {
    appendText(cursor, region.start)
    segments.push(region)
    cursor = region.end
  }
  appendText(cursor, bytes.length)

  return {segments, filteredRichText}
}
