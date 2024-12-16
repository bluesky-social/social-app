import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AtUri} from '@atproto/api'
import {hasMutedWord} from '@atproto/api/dist/moderation/mutewords'

import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'
import {feedUriToHref} from '#/lib/strings/url-helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {usePreferencesQuery} from '#/state/queries/preferences'
import type {TrendingTopic} from '#/state/queries/trending/useTrendingTopics'

export function TopicSmall({topic, style}: {topic: string} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_xs,
        a.px_sm,
        a.rounded_sm,
        a.border,
        t.atoms.border_contrast_medium,
        t.atoms.bg,
        style,
      ]}>
      <Text
        style={[a.flex_1, a.text_sm, a.font_bold, a.leading_tight]}
        numberOfLines={1}>
        {topic}
      </Text>
    </View>
  )
}

export function TrendingTopic({
  topic: raw,
  size,
  style,
}: {topic: TrendingTopic; size?: 'large' | 'small'} & ViewStyleProp) {
  const t = useTheme()
  const topic = useTopic(raw)

  if (!topic) return null

  const hasAvi = topic.type === 'feed' || topic.type === 'profile'

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        {
          padding: 6,
          gap: hasAvi ? 6 : 2,
        },
        a.pr_md,
        a.rounded_full,
        a.border,
        t.atoms.border_contrast_medium,
        t.atoms.bg,
        style,
      ]}>
      <View style={[a.align_center, a.justify_center, a.rounded_full, a.overflow_hidden, {
        width: 20,
        height: 20,
      }]}>
        {topic.type === 'tag' ? (
          <Hashtag size='sm' />
        ) : topic.type === 'topic' ? (
          <Search size='sm' />
        ) : topic.type === 'feed' ? (
          <UserAvatar type='user' size={20} avatar='https://cdn.bsky.app/img/avatar_thumbnail/plain/did:plc:vpkhqolt662uhesyj6nxm7ys/bafkreigpxhbzcwowt3fu6zrhdlen5hdw4onza2lnzg4rv7h5oddvhy4rpq@jpeg' />
        ) : (
          <UserAvatar type='user' size={20} avatar='https://cdn.bsky.app/img/avatar/plain/did:plc:ragtjsm2j2vknwkz3zp4oxrd/bafkreihhpqdyntku66himwor5wlhtdo44hllmngj2ofmbqnm25bdm454wq@jpeg' />
        )}
      </View>

      <Text
        style={[a.flex_1, a.text_md, a.font_bold, a.leading_tight, { paddingBottom: 1 }]}
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

export function Link({
  topic,
  children,
  style,
  ...rest
}: {
  topic: string
} & Omit<LinkProps, 'to' | 'label'>) {
  const {_} = useLingui()
  return (
    <InternalLink
      label={_(msg`Search posts that include ${topic}`)}
      to={{
        screen: 'Search',
        params: {q: topic},
      }}
      style={[a.flex_col, style]}
      {...rest}>
      {children}
    </InternalLink>
  )
}

// temp
export const TOPICS = [
  '#atproto',
  'South Korea',
  'Wired',
  'Basket Weaving',
  'Coup',
  'Chappel Roan',
  'the juice',
  'Superman',
  '#FCF',
  'Open Web',
]

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

    if (hasMutedWord({
      mutedWords,
      text: name
    })) return

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
  }, [raw, mutedWords])
}
