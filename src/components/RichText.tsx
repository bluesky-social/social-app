import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { View, Text, TextStyle, TouchableOpacity } from 'react-native';
import { AppBskyRichtextFacet, RichText as RichTextAPI } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';

import { NavigationProp } from '#/lib/routes/types';
import { toShortUrl } from '#/lib/strings/url-helpers';
import { isNative } from '#/platform/detection';
import { atoms as a, flatten, native, TextStyleProp, useTheme, web } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { InlineLinkText, LinkProps } from '#/components/Link';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { TagMenu, useTagMenuControl } from '#/components/TagMenu';

const WORD_WRAP = { wordWrap: 'break-word' };  // Updated for accuracy in web CSS

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
  const richText = useMemo(
    () => value instanceof RichTextAPI ? value : new RichTextAPI({ text: value }),
    [value]
  );

  const flattenedStyle = flatten(style);
  const plainStyles = [a.leading_snug, flattenedStyle];
  const interactiveStyles = [a.leading_snug, a.pointer_events_auto, flatten(interactiveStyle), flattenedStyle];

  const { text, facets } = richText;

  if (!facets?.length) {
    return renderSimpleText(text, selectable, testID, numberOfLines, plainStyles, emojiMultiplier);
  }

  const els = buildTextElements(richText, disableLinks, enableTags, authorHandle, interactiveStyles, onLinkPress);

  return (
    <Text selectable={selectable} testID={testID} style={plainStyles} numberOfLines={numberOfLines}>
      {els}
    </Text>
  );
}

function renderSimpleText(text, selectable, testID, numberOfLines, plainStyles, emojiMultiplier) {
  if (isOnlyEmoji(text)) {
    const fontSize = (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier;
    return (
      <Text selectable={selectable} testID={testID} style={[plainStyles, { fontSize }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }
  return (
    <Text selectable={selectable} testID={testID} style={plainStyles} numberOfLines={numberOfLines}>
      {text}
    </Text>
  );
}

const DEFAULT_DOMAIN = 'bsky.social';
const TLD_REGEX = /.\w+$/;  // Regex to check for a valid top-level domain

function buildTextElements(richText, disableLinks, enableTags, authorHandle, interactiveStyles, onLinkPress) {
  let key = 0;
  const elements = [];
  for (const segment of richText.segments()) {
    const { link, mention, tag } = segment;

    // Process mentions
    if (mention) {
      // Check if the mention contains a top-level domain to determine if it's a full handle
      const hasTLD = TLD_REGEX.test(mention.did);
      const fullMentionHandle = hasTLD ? mention.did : `${mention.did}@${DEFAULT_DOMAIN}`;

      // Validate the backend handle, but use the display text as provided in the segment
      if (AppBskyRichtextFacet.validateMention({ did: fullMentionHandle }).success && !disableLinks) {
        elements.push(
          <ProfileHoverCard key={key} inline did={fullMentionHandle}>
            <InlineLinkText
              selectable={selectable}
              to={`/profile/${fullMentionHandle}`}
              style={interactiveStyles}
              onPress={onLinkPress}>
              {`@${mention.did}`}  // Displaying the original user handle without domain
            </InlineLinkText>
          </ProfileHoverCard>
        );
      }
    }

    // Process links
    else if (link && AppBskyRichtextFacet.validateLink(link).success && !disableLinks) {
      elements.push(
        <InlineLinkText
          key={key}
          selectable={selectable}
          to={link.uri}
          style={interactiveStyles}
          onPress={onLinkPress}>
          {toShortUrl(segment.text)}
        </InlineLinkText>
      );
    }

    // Process tags
    else if (tag && AppBskyRichtextFacet.validateTag(tag).success && enableTags && !disableLinks) {
      elements.push(
        <RichTextTag
          key={key}
          text={segment.text}
          tag={tag.tag}
          style={interactiveStyles}
          selectable={selectable}
          authorHandle={authorHandle}
        />
      );
    }

    // Regular text
    else {
      elements.push(segment.text);
    }
    key++;
  }
  return elements;
}

function isOnlyEmoji(text) {
  return text.length <= 15 && /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(text);
}
