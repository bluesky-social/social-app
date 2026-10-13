import {View} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'

import {type RichTextCodeSegment, segmentRichTextCode} from '#/lib/code/parse'
import {countLines} from '#/lib/strings/helpers'
import {isRTLText} from '#/lib/strings/text-direction'
import {android, atoms as a} from '#/alf'
import {CodeBlock, InlineCodeText} from '#/components/CodeBlock'
import {RichText, type RichTextProps} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

/**
 * Post-only code formatting. Prose keeps the existing rich-text renderer;
 * panels are siblings of text, so native text layout never contains a block.
 */
export function PostBody({
  value,
  numberOfLines,
  previewNumberOfLines,
  style,
  testID,
  onLayout,
  suffix,
  suffixOffset = 0,
  ...richTextProps
}: Omit<RichTextProps, 'value' | 'onTextLayout'> & {
  value: RichTextAPI
  /** Keep plain quotes clamped while allowing short code to use panels. */
  previewNumberOfLines?: number
}) {
  const {segments, filteredRichText} = segmentRichTextCode(value)
  const lineLimit =
    numberOfLines ??
    (previewNumberOfLines !== undefined &&
    (filteredRichText === value ||
      countLines(value.text) >= previewNumberOfLines)
      ? previewNumberOfLines
      : undefined)

  /*
   * A single Text retains the existing line-clamp behavior for previews.
   * Opening the post or expanding it reveals the formatted panels.
   */
  if (filteredRichText === value || lineLimit !== undefined) {
    return (
      <RichText
        {...richTextProps}
        value={filteredRichText}
        numberOfLines={lineLimit}
        style={style}
        testID={testID}
        onLayout={onLayout}
        suffix={suffix}
        suffixOffset={suffixOffset}
      />
    )
  }

  const children: React.ReactNode[] = []
  let inline: RichTextCodeSegment[] = []
  const directionStyle =
    IS_NATIVE && isRTLText(value.text) ? {textAlign: 'right' as const} : null
  const suffixStyles =
    suffix && suffixOffset
      ? android({paddingBottom: suffixOffset, marginBottom: -suffixOffset})
      : null

  function flushInline(last = false) {
    if (!inline.length && !(last && suffix)) return
    children.push(
      <Text
        key={children.length}
        emoji
        selectable={richTextProps.selectable}
        style={[style, directionStyle, {flex: undefined}, last && suffixStyles]}
        dataSet={{wordWrap: 1}}>
        {inline.map((segment, index) =>
          segment.type === 'text' ? (
            <RichText
              {...richTextProps}
              key={index}
              value={segment.richText}
              style={[style, {flex: undefined}]}
              emojiMultiplier={1}
            />
          ) : (
            <InlineCodeText
              key={index}
              code={segment.code}
              displayCode={segment.displayCode}
              textStyle={style}
              selectable={richTextProps.selectable}
            />
          ),
        )}
        {last && suffix ? ' ' : null}
        {last ? suffix : null}
      </Text>,
    )
    inline = []
  }

  for (const [index, segment] of segments.entries()) {
    if (segment.type === 'block') {
      flushInline()
      children.push(
        <CodeBlock
          key={children.length}
          code={segment.code}
          displayCode={segment.displayCode}
          lang={segment.lang}
          textStyle={style}
          selectable={richTextProps.selectable}
        />,
      )
    } else if (segment.type === 'text') {
      const richText = trimBlockSpacing(
        segment.richText,
        segments[index - 1]?.type === 'block',
        segments[index + 1]?.type === 'block',
      )
      if (richText.text) inline.push({type: 'text', richText})
    } else {
      inline.push(segment)
    }
  }
  flushInline(true)

  return (
    <View testID={testID} onLayout={onLayout} style={[a.w_full]}>
      {children}
    </View>
  )
}

/** Panel margins replace separator line endings without changing the source. */
function trimBlockSpacing(
  richText: RichTextAPI,
  afterBlock: boolean,
  beforeBlock: boolean,
) {
  const leading = afterBlock
    ? (richText.text.match(/^[\r\n]+/)?.[0].length ?? 0)
    : 0
  const trailing = beforeBlock
    ? (richText.text.match(/[\r\n]+$/)?.[0].length ?? 0)
    : 0
  if (!leading && !trailing) return richText
  const end = Math.max(leading, richText.unicodeText.utf8.length - trailing)
  /* UTF-16 slicing preserves a leading BOM that SDK byte decoding can remove. */
  return new RichTextAPI({
    text: richText.text.slice(
      leading,
      Math.max(leading, richText.text.length - trailing),
    ),
    facets: richText.facets
      ?.filter(({index}) => index.byteStart < end && index.byteEnd > leading)
      .map(facet => ({
        ...facet,
        index: {
          byteStart: Math.max(leading, facet.index.byteStart) - leading,
          byteEnd: Math.min(end, facet.index.byteEnd) - leading,
        },
      })),
  })
}
