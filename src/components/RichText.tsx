import React from 'react'
import {TextStyle} from 'react-native'
import {AppBskyRichtextFacet, RichText as RichTextAPI} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {toShortUrl} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {atoms as a, flatten, native, TextStyleProp, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {InlineLinkText, LinkProps} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {TagMenu, useTagMenuControl} from '#/components/TagMenu'
import {Text, TextProps} from '#/components/Typography'

const WORD_WRAP = {wordWrap: 1}

export type RichTextProps = TextStyleProp &
  Pick<TextProps, 'selectable'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    enableTags?: boolean
    authorHandle?: string
    onLinkPress?: LinkProps['onPress']
    interactiveStyle?: TextStyle
    emojiMultiplier?: number
  }

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  selectable,
  enableTags = false,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier = 1.85,
}: RichTextProps) {
  const richText = React.useMemo(
    () =>
      value instanceof RichTextAPI ? value : new RichTextAPI({text: value}),
    [value],
  )

  const flattenedStyle = flatten(style)
  const plainStyles = [a.leading_snug, flattenedStyle]
  const interactiveStyles = [
    a.leading_snug,
    a.pointer_events_auto,
    flatten(interactiveStyle),
    flattenedStyle,
  ]

  const {text, facets} = richText

  if (!facets?.length) {
    if (isOnlyEmoji(text)) {
      const fontSize =
        (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={[plainStyles, {fontSize}]}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }
    return (
      <Text
        emoji
        selectable={selectable}
        testID={testID}
        style={plainStyles}
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
        <ProfileHoverCard key={key} inline did={mention.did}>
          <InlineLinkText
            selectable={selectable}
            to={`/profile/${mention.did}`}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            onPress={onLinkPress}>
            {segment.text}
          </InlineLinkText>
        </ProfileHoverCard>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      if (disableLinks) {
        els.push(toShortUrl(segment.text))
      } else {
        els.push(
          <InlineLinkText
            selectable={selectable}
            key={key}
            to={link.uri}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shareOnLongPress
            onPress={onLinkPress}
            emoji>
            {toShortUrl(segment.text)}
          </InlineLinkText>,
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
          tag={tag.tag}
          style={interactiveStyles}
          selectable={selectable}
          authorHandle={authorHandle}
        />,
      )
    } else {
      els.push(
        <Text key={key} emoji style={plainStyles}>
          {segment.text}
        </Text>,
      )
    }
    key++
  }

  return (
    <Text
      selectable={selectable}
      testID={testID}
      style={plainStyles}
      numberOfLines={numberOfLines}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}

function RichTextTag({
  text,
  tag,
  style,
  selectable,
  authorHandle,
}: {
  text: string
  tag: string
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
  const navigation = useNavigation<NavigationProp>()

  const navigateToPage = React.useCallback(() => {
    navigation.push('Hashtag', {
      tag: encodeURIComponent(tag),
    })
  }, [navigation, tag])

  const openDialog = React.useCallback(() => {
    control.open()
  }, [control])

  /*
   * N.B. On web, this is wrapped in another pressable comopnent with a11y
   * labels, etc. That's why only some of these props are applied here.
   */

  return (
    <React.Fragment>
      <TagMenu control={control} tag={tag} authorHandle={authorHandle}>
        <Text
          emoji
          selectable={selectable}
          {...native({
            accessibilityLabel: _(msg`Hashtag: #${tag}`),
            accessibilityHint: _(msg`Long press to open tag menu for #${tag}`),
            accessibilityRole: isNative ? 'button' : undefined,
            onPress: navigateToPage,
            onLongPress: openDialog,
            onPressIn: onPressIn,
            onPressOut: onPressOut,
          })}
          {...web({
            onMouseEnter: onHoverIn,
            onMouseLeave: onHoverOut,
          })}
          // @ts-ignore
          onFocus={onFocus}
          onBlur={onBlur}
          style={[
            web({
              cursor: 'pointer',
            }),
            {color: t.palette.primary_500},
            (hovered || focused || pressed) && {
              ...web({outline: 0}),
              textDecorationLine: 'underline',
              textDecorationColor: t.palette.primary_500,
            },
            style,
          ]}>
          {text}
        </Text>
      </TagMenu>
    </React.Fragment>
  )
}

export function isOnlyEmoji(text: string) {
  return (
    text.length <= 15 &&
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(text)
  )
}
