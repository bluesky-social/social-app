import React from 'react'
import {RichText as RichTextAPI, AppBskyRichtextFacet} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

import {atoms as a, TextStyleProp, flatten, useTheme, web} from '#/alf'
import {InlineLink} from '#/components/Link'
import {Text, TextProps} from '#/components/Typography'
import {toShortUrl} from 'lib/strings/url-helpers'
import {TagMenu, useTagMenuControl} from '#/components/TagMenu'
import {isNative} from '#/platform/detection'
import {useInteractionState} from '#/components/hooks/useInteractionState'

const WORD_WRAP = {wordWrap: 1}

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  selectable,
  enableTags = false,
  authorHandle,
}: TextStyleProp &
  Pick<TextProps, 'selectable'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    enableTags?: boolean
    authorHandle?: string
  }) {
  const richText = React.useMemo(
    () =>
      value instanceof RichTextAPI ? value : new RichTextAPI({text: value}),
    [value],
  )
  const styles = [a.leading_snug, flatten(style)]

  const {text, facets} = richText

  if (!facets?.length) {
    if (text.length <= 5 && /^\p{Extended_Pictographic}+$/u.test(text)) {
      return (
        <Text
          selectable={selectable}
          testID={testID}
          style={[
            {
              fontSize: 26,
              lineHeight: 30,
            },
          ]}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }
    return (
      <Text
        selectable={selectable}
        testID={testID}
        style={styles}
        numberOfLines={numberOfLines}
        // @ts-ignore web only -prf
        dataSet={WORD_WRAP}>
        {text}
      </Text>
    )
  }

  const els = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    const tag = segment.tag
    if (
      mention &&
      AppBskyRichtextFacet.validateMention(mention).success &&
      !disableLinks
    ) {
      els.push(
        <InlineLink
          selectable={selectable}
          key={key}
          to={`/profile/${mention.did}`}
          style={[...styles, {pointerEvents: 'auto'}]}
          // @ts-ignore TODO
          dataSet={WORD_WRAP}>
          {segment.text}
        </InlineLink>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      if (disableLinks) {
        els.push(toShortUrl(segment.text))
      } else {
        els.push(
          <InlineLink
            selectable={selectable}
            key={key}
            to={link.uri}
            style={[...styles, {pointerEvents: 'auto'}]}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            warnOnMismatchingLabel>
            {toShortUrl(segment.text)}
          </InlineLink>,
        )
      }
    } else if (
      !disableLinks &&
      enableTags &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      els.push(
        <RichTextTag
          key={key}
          text={segment.text}
          style={styles}
          selectable={selectable}
          authorHandle={authorHandle}
        />,
      )
    } else {
      els.push(segment.text)
    }
    key++
  }

  return (
    <Text
      selectable={selectable}
      testID={testID}
      style={styles}
      numberOfLines={numberOfLines}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}

function RichTextTag({
  text: tag,
  style,
  selectable,
  authorHandle,
}: {
  text: string
  selectable?: boolean
  authorHandle?: string
} & TextStyleProp) {
  const t = useTheme()
  const {_} = useLingui()
  const control = useTagMenuControl()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  const open = React.useCallback(() => {
    control.open()
  }, [control])

  const styles = [
    style,
    {
      pointerEvents: 'auto',
      color: t.palette.primary_500,
    },
    web({
      cursor: 'pointer',
    }),
    (hovered || focused || pressed) && {
      ...web({outline: 0}),
      textDecorationLine: 'underline',
      textDecorationColor: t.palette.primary_500,
    },
  ]

  /*
   * N.B. On web, this is wrapped in another pressable comopnent with a11y
   * labels, etc. Hence the conditional render.
   */

  return (
    <React.Fragment>
      <TagMenu control={control} tag={tag} authorHandle={authorHandle}>
        {isNative ? (
          <Text
            selectable={selectable}
            accessibilityLabel={_(msg`Hashtag: ${tag}`)}
            accessibilityHint={_(msg`Click here to open tag menu for ${tag}`)}
            accessibilityRole={isNative ? 'button' : undefined}
            onPress={open}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles}>
            {tag}
          </Text>
        ) : (
          <Text
            selectable={selectable}
            // @ts-ignore web only
            onMouseEnter={onHoverIn}
            // @ts-ignore web only
            onMouseLeave={onHoverOut}
            // @ts-ignore web only
            onFocus={onFocus}
            // @ts-ignore web only
            onBlur={onBlur}
            style={styles}>
            {tag}
          </Text>
        )}
      </TagMenu>
    </React.Fragment>
  )
}
