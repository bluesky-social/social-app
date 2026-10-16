import {RichText as RichTextAPI, UnicodeString} from '@bsky/sdk/richtext'
import {type Nodes} from 'mdast'
import {fromMarkdown} from 'mdast-util-from-markdown'

export type CodeRegion = {
  type: 'block' | 'inline'
  /** UTF-8 byte offset where the code starts, including its delimiters. */
  start: number
  /** Exclusive UTF-8 byte offset where the code ends. */
  end: number
  code: string
  lang?: string
}

export type PostTextSegment = {type: 'text'; richText: RichTextAPI} | CodeRegion

/*
 * Only code is recognized. Other Markdown is disabled so it can't change where
 * code starts and ends, e.g. a link or HTML tag swallowing a backtick.
 * Indented code stays enabled because it limits how far a fence can be
 * indented, but indented code itself is left as prose.
 */
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
 * Finds fenced code blocks and inline code spans, in source order.
 */
export function parseCodeRegions(text: string): CodeRegion[] {
  if (!text.includes('`') && !text.includes('~~~')) return []

  const unicodeText = new UnicodeString(text)
  const toUtf8 = (index: number) => unicodeText.utf16IndexToUtf8Index(index)
  /** The parser leaves a leading BOM out of its offsets. */
  const bomLength = text.startsWith('﻿') ? 1 : 0
  const regions: CodeRegion[] = []

  function visit(node: Nodes) {
    if (node.type === 'inlineCode') {
      regions.push({
        type: 'inline',
        start: toUtf8(node.position!.start.offset! + bomLength),
        end: toUtf8(node.position!.end.offset! + bomLength),
        // Line endings inside a code span render as spaces.
        code: node.value.replace(/\r\n?|\n/g, ' '),
      })
    } else if (node.type === 'code') {
      const start = node.position!.start.offset! + bomLength
      if (!text.startsWith('```', start) && !text.startsWith('~~~', start)) {
        return
      }
      /*
       * Start at the beginning of the line, so quote or list markers before
       * the fence don't render as a stray line above the panel.
       */
      const lineStart =
        Math.max(
          text.lastIndexOf('\n', start - 1),
          text.lastIndexOf('\r', start - 1),
        ) + 1
      regions.push({
        type: 'block',
        start: toUtf8(lineStart),
        end: toUtf8(node.position!.end.offset! + bomLength),
        code: node.value,
        lang: node.lang ?? undefined,
      })
    } else if ('children' in node) {
      node.children.forEach(visit)
    }
  }

  visit(
    fromMarkdown(text, {extensions: [{disable: {null: disabledConstructs}}]}),
  )
  return regions
}

/**
 * Splits post text around its code, or returns null if there is none.
 *
 * Facets that overlap code are dropped, so mentions and links inside code stay
 * literal. The rest are rebased onto the text segment that contains them.
 * `richText` is the whole text with only those remaining facets.
 */
export function segmentRichTextCode(richText: RichTextAPI) {
  const regions = parseCodeRegions(richText.text)
  if (!regions.length) return null

  /** segments() resolves overlapping facets the same way RichText does. */
  const facets = [...richText.segments()].flatMap(({facet}) =>
    facet &&
    !regions.some(
      region =>
        facet.index.byteStart < region.end &&
        facet.index.byteEnd > region.start,
    )
      ? [facet]
      : [],
  )
  const bytes = richText.unicodeText.utf8
  const decoder = new TextDecoder('utf-8', {ignoreBOM: true})
  const segments: PostTextSegment[] = []

  function pushText(
    start: number,
    end: number,
    {afterBlock, beforeBlock}: {afterBlock: boolean; beforeBlock: boolean},
  ) {
    // A block's margins stand in for the line breaks around it.
    while (afterBlock && start < end && isLineBreak(bytes[start])) start++
    while (beforeBlock && end > start && isLineBreak(bytes[end - 1])) end--
    if (start === end) return
    segments.push({
      type: 'text',
      richText: new RichTextAPI({
        text: decoder.decode(bytes.subarray(start, end)),
        facets: facets
          .filter(({index}) => index.byteStart >= start && index.byteEnd <= end)
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

  let cursor = 0
  let previous: CodeRegion | undefined
  for (const region of regions) {
    pushText(cursor, region.start, {
      afterBlock: previous?.type === 'block',
      beforeBlock: region.type === 'block',
    })
    segments.push(region)
    cursor = region.end
    previous = region
  }
  pushText(cursor, bytes.length, {
    afterBlock: previous?.type === 'block',
    beforeBlock: false,
  })

  return {
    segments,
    richText: new RichTextAPI({text: richText.text, facets}),
  }
}

function isLineBreak(byte: number) {
  return byte === 0x0a || byte === 0x0d
}
