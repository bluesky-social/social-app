import {Fragment, type ReactNode, useMemo} from 'react'
import {type StyleProp, type TextStyle, View} from 'react-native'
import {AppBskyRichtextFacet, RichText as RichTextAPI} from '@atproto/api'

import {hasCode} from '#/lib/code/parse'
import {toShortUrl} from '#/lib/strings/url-helpers'
import {atoms as a, flatten, type TextStyleProp} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {InlineLinkText, type LinkProps} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {type CodePart, parseCodeParts} from '#/components/RichTextCode'
import {RichTextTag} from '#/components/RichTextTag'
import {Text, type TextProps} from '#/components/Typography'

const WORD_WRAP = {wordWrap: 1}
// lifted from facet detection in `RichText` impl, _without_ `gm` flags
const URL_REGEX =
  /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/i

export type RichTextProps = TextStyleProp &
  Pick<TextProps, 'selectable' | 'onLayout' | 'onTextLayout'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    enableTags?: boolean
    /**
     * Render Markdown-style code in the text: inline `code` and fenced
     * ```lang\n...``` blocks. Opt-in; enabled for post bodies. See
     * `#/components/RichTextCode`.
     */
    enableCode?: boolean
    authorHandle?: string
    onLinkPress?: LinkProps['onPress']
    interactiveStyle?: StyleProp<TextStyle>
    emojiMultiplier?: number
    shouldProxyLinks?: boolean
    /**
     * Rendered inline after the last text segment, so it flows with the final
     * line and wraps with the text, e.g. the thread position indicator in the
     * post thread's linear view. Must be text-compatible (a string or nested
     * <Text>).
     */
    trailing?: ReactNode
    /**
     * DANGEROUS: Disable facet lexicon validation
     *
     * `detectFacetsWithoutResolution()` generates technically invalid facets,
     * with a handle in place of the DID. This means that RichText that uses it
     * won't be able to render links.
     *
     * Use with care - only use if you're rendering facets you're generating yourself.
     */
    disableMentionFacetValidation?: true
  }

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  selectable,
  enableTags = false,
  enableCode = false,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier = 1.85,
  onLayout,
  onTextLayout,
  shouldProxyLinks,
  disableMentionFacetValidation,
  trailing,
}: RichTextProps) {
  const richText = useMemo(() => {
    if (value instanceof RichTextAPI) {
      return value
    } else {
      const rt = new RichTextAPI({text: value})
      rt.detectFacetsWithoutResolution()
      return rt
    }
  }, [value])

  const plainStyles = style
  const interactiveStyles = [plainStyles, interactiveStyle]

  const {text, facets} = richText
  // Fast guard: only do code parsing/highlighting when the post actually
  // contains a backtick span. Plain posts (the overwhelming majority) skip the
  // parts-assembly machinery entirely and render exactly as before.
  const codeActive = enableCode && hasCode(text)
  // Fenced blocks render as <View> panels only in full views. When the text is
  // line-clamped (feed previews, quote embeds), keep them inline so
  // `numberOfLines` still works - a block <View> can't be truncated by a parent
  // <Text>.
  const blockMode = codeActive && !numberOfLines

  // Assemble parts into the final tree. With no block parts this is the single
  // <Text> we've always rendered. With a block (a fenced code <View>, which
  // can't live inside a <Text>), group consecutive inline parts into <Text>
  // runs and emit blocks as siblings inside a wrapping <View>.
  const renderParts = (parts: CodePart[]): ReactNode => {
    if (!parts.some(p => p.block)) {
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={plainStyles}
          numberOfLines={numberOfLines}
          onLayout={onLayout}
          onTextLayout={onTextLayout}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {parts.map(p => p.node)}
          {trailing}
        </Text>
      )
    }
    const out: ReactNode[] = []
    let run: ReactNode[] = []
    let runKey = 0
    const flushRun = () => {
      if (run.length === 0) return
      const children = run
      out.push(
        <Text
          key={`run${runKey}`}
          emoji
          selectable={selectable}
          style={plainStyles}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {children}
        </Text>,
      )
      runKey++
      run = []
    }
    for (const part of parts) {
      if (part.block) {
        flushRun()
        out.push(part.node)
      } else {
        run.push(part.node)
      }
    }
    if (trailing) {
      run.push(<Fragment key="trailing">{trailing}</Fragment>)
    }
    flushRun()
    // NOTE: posts with a fenced block in a full view render as a <View
    // testID={testID}> wrapping <Text> runs, rather than the usual single
    // <Text testID={testID}>. testID stays on the wrapper, but the structure
    // differs - E2E/a11y logic that assumes postText is one Text node with
    // concatenated children will see a different shape for such posts.
    // Forward onLayout (View supports it). onTextLayout is Text-only, so it's
    // dropped on this path - only reached in full views (!numberOfLines), where
    // no post-body caller relies on it for height/truncation measurement.
    return (
      <View testID={testID} style={a.flex_1} onLayout={onLayout}>
        {out}
      </View>
    )
  }

  if (!facets?.length) {
    if (isOnlyEmoji(text)) {
      const flattenedStyle = flatten(style) ?? {}
      const fontSize =
        (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={[plainStyles, {fontSize}]}
          onLayout={onLayout}
          onTextLayout={onTextLayout}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
          {trailing}
        </Text>
      )
    }
    return renderParts(
      codeActive
        ? parseCodeParts(text, 'c', blockMode)
        : [{block: false, node: text}],
    )
  }

  const parts: CodePart[] = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    const tag = segment.tag

    if (
      mention &&
      (disableMentionFacetValidation ||
        AppBskyRichtextFacet.validateMention(mention).success) &&
      !disableLinks
    ) {
      parts.push({
        block: false,
        node: (
          <ProfileHoverCard key={key} did={mention.did}>
            <InlineLinkText
              selectable={selectable}
              to={`/profile/${mention.did}`}
              style={interactiveStyles}
              // @ts-ignore TODO
              dataSet={WORD_WRAP}
              shouldProxy={shouldProxyLinks}
              onPress={onLinkPress}>
              {segment.text}
            </InlineLinkText>
          </ProfileHoverCard>
        ),
      })
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      const isValidLink = URL_REGEX.test(link.uri)
      if (!isValidLink || disableLinks) {
        parts.push({block: false, node: toShortUrl(segment.text)})
      } else {
        parts.push({
          block: false,
          node: (
            <InlineLinkText
              selectable={selectable}
              key={key}
              to={link.uri}
              style={interactiveStyles}
              // @ts-ignore TODO
              dataSet={WORD_WRAP}
              shareOnLongPress
              shouldProxy={shouldProxyLinks}
              onPress={onLinkPress}
              emoji>
              {toShortUrl(segment.text)}
            </InlineLinkText>
          ),
        })
      }
    } else if (
      !disableLinks &&
      enableTags &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      parts.push({
        block: false,
        node: (
          <RichTextTag
            key={key}
            display={segment.text}
            tag={tag.tag}
            textStyle={interactiveStyles}
            authorHandle={authorHandle}
          />
        ),
      })
    } else if (codeActive) {
      parts.push(...parseCodeParts(segment.text, `c${key}`, blockMode))
    } else {
      parts.push({block: false, node: segment.text})
    }
    key++
  }

  return renderParts(parts)
}
