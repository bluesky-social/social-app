import React from 'react'
import {View} from 'react-native'
import {type AtUri} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
// import {makeProfileLink} from '#/lib/routes/links'
// import {feedUriToHref} from '#/lib/strings/url-helpers'
// import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
// import {CloseQuote_Filled_Stroke2_Corner0_Rounded as Quote} from '#/components/icons/Quote'
// import {UserAvatar} from '#/view/com/util/UserAvatar'
import {type TrendingTopic} from '#/state/queries/trending/useTrendingTopics'
import {atoms as a, native, useTheme, type ViewStyleProp} from '#/alf'
import {StarterPack as StarterPackIcon} from '#/components/icons/StarterPack'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function TrendingTopic({
  topic: raw,
  size,
  style,
  hovered,
}: {
  topic: TrendingTopic
  size?: 'large' | 'small'
  hovered?: boolean
} & ViewStyleProp) {
  const topic = useTopic(raw)

  const isSmall = size === 'small'
  const hasIcon = topic.type === 'starter-pack' && !isSmall
  const iconSize = 20

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        isSmall
          ? [
              {
                paddingVertical: 2,
                paddingHorizontal: 4,
              },
            ]
          : [a.py_xs, a.px_sm],
        hasIcon && {gap: 6},
        style,
      ]}>
      {hasIcon && topic.type === 'starter-pack' && (
        <StarterPackIcon
          gradient="sky"
          width={iconSize}
          style={{marginLeft: -3, marginVertical: -1}}
        />
      )}

      {/*
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_full,
            a.overflow_hidden,
            {
              width: iconSize,
              height: iconSize,
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
          a.font_semi_bold,
          a.leading_tight,
          isSmall ? [a.text_sm] : [a.text_md, {paddingBottom: 1}],
          hovered && {textDecorationLine: 'underline'},
        ]}
        numberOfLines={1}>
        {topic.displayName}
      </Text>
    </View>
  )
}

export function TrendingTopicSkeleton({
  size = 'large',
  index = 0,
}: {
  size?: 'large' | 'small'
  index?: number
}) {
  const t = useTheme()
  const isSmall = size === 'small'
  return (
    <View
      style={[
        a.rounded_full,
        a.border,
        t.atoms.border_contrast_medium,
        t.atoms.bg_contrast_25,
        isSmall
          ? {
              width: index % 2 === 0 ? 75 : 90,
              height: 27,
            }
          : {
              width: index % 2 === 0 ? 90 : 110,
              height: 36,
            },
      ]}
    />
  )
}

export function TrendingTopicLink({
  topic: raw,
  children,
  ...rest
}: {
  topic: TrendingTopic
} & Omit<LinkProps, 'to' | 'label'>) {
  const topic = useTopic(raw)

  return (
    <InternalLink
      label={topic.label}
      to={topic.url}
      PressableComponent={native(PressableScale)}
      {...rest}>
      {children}
    </InternalLink>
  )
}

type ParsedTrendingTopic =
  | {
      type: 'topic' | 'tag' | 'starter-pack' | 'unknown'
      label: string
      displayName: string
      url: string
      uri: undefined
    }
  | {
      type: 'profile' | 'feed'
      label: string
      displayName: string
      url: string
      uri: AtUri
    }

export function useTopic(raw: TrendingTopic): ParsedTrendingTopic {
  const {_} = useLingui()
  return React.useMemo(() => {
    const {topic: displayName, link} = raw

    if (link.startsWith('/search')) {
      return {
        type: 'topic',
        label: _(msg`Browse posts about ${displayName}`),
        displayName,
        uri: undefined,
        url: link,
      }
    } else if (link.startsWith('/hashtag')) {
      return {
        type: 'tag',
        label: _(msg`Browse posts tagged with ${displayName}`),
        displayName,
        // displayName: displayName.replace(/^#/, ''),
        uri: undefined,
        url: link,
      }
    } else if (link.startsWith('/starter-pack')) {
      return {
        type: 'starter-pack',
        label: _(msg`Browse starter pack ${displayName}`),
        displayName,
        uri: undefined,
        url: link,
      }
    }

    /*
    if (!link.startsWith('at://')) {
      // above logic
    } else {
      const urip = new AtUri(link)
      switch (urip.collection) {
        case 'app.bsky.actor.profile': {
          return {
            type: 'profile',
            label: _(msg`View ${displayName}'s profile`),
            displayName,
            uri: urip,
            url: makeProfileLink({did: urip.host, handle: urip.host}),
          }
        }
        case 'app.bsky.feed.generator': {
          return {
            type: 'feed',
            label: _(msg`Browse the ${displayName} feed`),
            displayName,
            uri: urip,
            url: feedUriToHref(link),
          }
        }
      }
    }
     */

    return {
      type: 'unknown',
      label: _(msg`Browse topic ${displayName}`),
      displayName,
      uri: undefined,
      url: link,
    }
  }, [_, raw])
}
