import React from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/api'
import {hasMutedWord} from '@atproto/api/dist/moderation/mutewords'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {feedUriToHref} from '#/lib/strings/url-helpers'
// import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
// import {CloseQuote_Filled_Stroke2_Corner0_Rounded as Quote} from '#/components/icons/Quote'
// import {UserAvatar} from '#/view/com/util/UserAvatar'
import {usePreferencesQuery} from '#/state/queries/preferences'
import type {TrendingTopic} from '#/state/queries/trending/useTrendingTopics'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function TrendingTopic({
  topic: raw,
  size,
  style,
}: {topic: TrendingTopic; size?: 'large' | 'small'} & ViewStyleProp) {
  const t = useTheme()
  const topic = useTopic(raw)

  if (!topic) return null

  const isSmall = size === 'small'
  // const hasAvi = topic.type === 'feed' || topic.type === 'profile'
  // const aviSize = isSmall ? 16 : 20
  // const iconSize = isSmall ? 16 : 20

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.rounded_full,
        a.border,
        t.atoms.border_contrast_medium,
        t.atoms.bg,
        isSmall
          ? [
              {
                paddingVertical: 5,
                paddingHorizontal: 10,
              },
            ]
          : [a.py_sm, a.px_md],
        style,
        /*
        {
          padding: 6,
          gap: hasAvi ? 4 : 2,
        },
        a.pr_md,
       */
      ]}>
      {/*
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          a.overflow_hidden,
          {
            width: aviSize,
            height: aviSize,
          },
        ]}>
        {topic.type === 'tag' ? (
          <Hashtag width={iconSize} />
        ) : topic.type === 'topic' ? (
          <Quote width={iconSize - 2} />
        ) : topic.type === 'feed' ? (
          <UserAvatar
            type="user"
            size={aviSize}
            avatar=""
          />
        ) : (
          <UserAvatar
            type="user"
            size={aviSize}
            avatar=""
          />
        )}
      </View>
        */}

      <Text
        style={[
          a.flex_1,
          a.font_bold,
          a.leading_tight,
          isSmall ? [a.text_sm] : [a.text_md, {paddingBottom: 1}],
        ]}
        numberOfLines={1}>
        {topic.name}
      </Text>
    </View>
  )
}

export function TrendingTopicLink({
  topic: raw,
  children,
  style,
  ...rest
}: {
  topic: TrendingTopic
} & Omit<LinkProps, 'to' | 'label'>) {
  const topic = useTopic(raw)

  if (!topic) return null

  return (
    <InternalLink
      label={topic.label}
      to={topic.url}
      style={[a.flex_col, style]}
      {...rest}>
      {children}
    </InternalLink>
  )
}

type ParsedTrendingTopic =
  | {
      type: 'topic' | 'tag'
      label: string
      name: string
      url: string
      uri: undefined
    }
  | {
      type: 'profile' | 'feed'
      label: string
      name: string
      url: string
      uri: AtUri
    }

export function useMutedWords() {
  const {data: preferences} = usePreferencesQuery()
  return React.useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs?.mutedWords])
}

export function useTopic(raw: TrendingTopic): ParsedTrendingTopic | undefined {
  const {_} = useLingui()
  const mutedWords = useMutedWords()

  return React.useMemo(() => {
    const {topic: name, link: uri} = raw

    if (
      hasMutedWord({
        mutedWords,
        text: name,
      })
    )
      return

    if (!uri.startsWith('at://')) {
      if (uri.startsWith('/search')) {
        return {
          type: 'topic',
          label: _(msg`Browse posts about ${name}`),
          name,
          uri: undefined,
          url: uri,
        }
      } else if (uri.startsWith('/hashtag')) {
        return {
          type: 'tag',
          label: _(msg`Browse posts tagged with ${name}`),
          name: name.replace(/^#/, ''),
          uri: undefined,
          url: uri,
        }
      }
    } else {
      const urip = new AtUri(uri)
      switch (urip.collection) {
        case 'app.bsky.actor.profile': {
          return {
            type: 'profile',
            label: _(msg`View ${name}'s profile`),
            name,
            uri: urip,
            url: makeProfileLink({did: urip.host, handle: urip.host}),
          }
        }
        case 'app.bsky.feed.generator': {
          return {
            type: 'feed',
            label: _(msg`Browse the ${name} feed`),
            name,
            uri: urip,
            url: feedUriToHref(uri),
          }
        }
      }
    }
  }, [_, raw, mutedWords])
}
