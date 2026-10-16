import {View} from 'react-native'
import {type RichText as RichTextAPI} from '@bsky/sdk/richtext'

import {segmentRichTextCode} from '#/lib/code/parse'
import {countLines} from '#/lib/strings/helpers'
import {isRTLText} from '#/lib/strings/text-direction'
import {android, atoms as a} from '#/alf'
import {CodeBlock, InlineCode} from '#/components/CodeBlock'
import {RichText, type RichTextProps} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

/**
 * Post text with Markdown code rendered as code. Code blocks sit between
 * paragraphs rather than inside them, since native text layout can't contain
 * a block.
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
  /**
   * Line clamp for previews such as quotes. Short posts with code skip it, so
   * their code still renders as panels.
   */
  previewNumberOfLines?: number
}) {
  const code = segmentRichTextCode(value)
  const isClamped =
    numberOfLines !== undefined ||
    (previewNumberOfLines !== undefined &&
      countLines(value.text) >= previewNumberOfLines)

  /*
   * Clamping needs a single Text, so clamped posts show code as plain text
   * until they're opened or expanded.
   */
  if (!code || isClamped) {
    return (
      <RichText
        {...richTextProps}
        value={code?.richText ?? value}
        numberOfLines={numberOfLines ?? previewNumberOfLines}
        style={style}
        testID={testID}
        onLayout={onLayout}
        suffix={suffix}
        suffixOffset={suffixOffset}
      />
    )
  }

  const {selectable} = richTextProps
  const paragraphStyle = [
    style,
    // A caller's flex_1 would collapse paragraphs inside this column.
    {flex: undefined},
    IS_NATIVE && isRTLText(value.text) ? a.text_right : null,
  ]
  const suffixStyle =
    suffix && suffixOffset
      ? android({paddingBottom: suffixOffset, marginBottom: -suffixOffset})
      : null
  const children: React.ReactNode[] = []
  let paragraph: React.ReactNode[] = []

  function endParagraph(isLast: boolean) {
    if (!paragraph.length && !(isLast && suffix)) return
    children.push(
      <Text
        key={children.length}
        emoji
        selectable={selectable}
        style={[paragraphStyle, isLast && suffixStyle]}
        dataSet={{wordWrap: 1}}>
        {paragraph}
        {isLast && suffix ? ' ' : null}
        {isLast ? suffix : null}
      </Text>,
    )
    paragraph = []
  }

  for (const segment of code.segments) {
    if (segment.type === 'text') {
      paragraph.push(
        <RichText
          {...richTextProps}
          key={paragraph.length}
          value={segment.richText}
          style={style}
          // Emoji-only text beside code shouldn't be enlarged.
          emojiMultiplier={1}
        />,
      )
    } else if (segment.type === 'inline') {
      paragraph.push(
        <InlineCode
          key={paragraph.length}
          code={segment.code}
          style={style}
          selectable={selectable}
        />,
      )
    } else {
      endParagraph(false)
      children.push(
        <CodeBlock
          key={children.length}
          code={segment.code}
          lang={segment.lang}
          style={style}
          selectable={selectable}
        />,
      )
    }
  }
  endParagraph(true)

  return (
    <View testID={testID} onLayout={onLayout} style={[a.w_full]}>
      {children}
    </View>
  )
}
