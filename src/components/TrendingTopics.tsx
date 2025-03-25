import React, {useMemo} from 'react'
import {Pressable, View} from 'react-native'
import {type AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {type TrendingTopic} from '#/state/queries/trending/useTrendingTopics'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {
  atoms as a,
  native,
  useGutters,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {StarterPack as StarterPackIcon} from '#/components/icons/StarterPack'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'
import {AvatarStackWithFetch} from './AvatarStack'
import {Flame_Stroke2_Corner1_Rounded as FlameIcon} from './icons/Flame'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from './icons/Trending'

export function TrendingTopicRow({
  topic: raw,
  rank,
  children,
  onPress,
}: {
  topic: TrendingTopic
  rank: number
  children?: React.ReactNode
  onPress?: () => void
}) {
  const t = useTheme()
  const topic = useTopic(raw)
  const gutters = useGutters([0, 'base'])

  const {description, randomProfiles} = useTempData()

  return (
    <>
      <TrendingTopicLink
        topic={raw}
        testID={`trendingTopic:${rank}`}
        onPress={onPress}
        style={native([a.border_t, t.atoms.border_contrast_low])}
        PressableComponent={Pressable}>
        {({hovered, focused, pressed}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.gap_2xs,
              gutters,
              a.pt_md,
              !children ? a.pb_md : a.pb_sm,
              (hovered || focused || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <View style={[a.flex_shrink_0, {minWidth: 20}]}>
              <Text style={[a.text_md, a.font_bold]}>
                <Trans comment='The starter pack rank, i.e. "1. March Madness", "2. The Bachelor"'>
                  {rank}.
                </Trans>
              </Text>
            </View>
            <View style={[a.flex_1, a.flex_row, a.gap_sm, a.justify_between]}>
              <View style={[a.flex_1]}>
                <Text style={[a.text_md, a.font_bold]} numberOfLines={1}>
                  {topic.displayName}
                </Text>
                <View style={[a.mt_xs, a.flex_row, a.gap_sm, a.align_center]}>
                  <AvatarStackWithFetch size={16} profiles={randomProfiles} />
                  <Text
                    style={[a.text_sm, t.atoms.text_contrast_medium]}
                    numberOfLines={1}>
                    {description}
                  </Text>
                </View>
              </View>
              <View style={[a.flex_shrink_0]}>
                <TrendingIndicator
                  type={
                    // TEMP
                    (['hot', 'new', 3, 4, 'new'] as const)[rank - 1]
                  }
                />
              </View>
            </View>
          </View>
        )}
      </TrendingTopicLink>
      {children && (
        <>
          {children}
          <View style={[a.flex_1, a.pb_md]} />
        </>
      )}
    </>
  )
}

type TrendingIndicatorType = 'hot' | 'new' | number

function TrendingIndicator({type}: {type: TrendingIndicatorType | 'skeleton'}) {
  const t = useTheme()

  const pillStyle = [
    a.flex_row,
    a.align_center,
    a.gap_xs,
    {paddingHorizontal: 10, paddingVertical: 6},
    a.rounded_full,
  ]

  const textStyle = [a.font_bold, a.text_sm]

  switch (type) {
    case 'hot': {
      const color =
        t.scheme === 'light' ? t.palette.negative_500 : t.palette.negative_950
      const backgroundColor =
        t.scheme === 'light' ? t.palette.negative_50 : t.palette.negative_200
      return (
        <View style={[pillStyle, {backgroundColor}]}>
          <FlameIcon size="sm" style={{color}} />
          <Text style={[textStyle, {color}]}>
            <Trans>Hot</Trans>
          </Text>
        </View>
      )
    }
    case 'new': {
      return (
        <View style={[pillStyle, {backgroundColor: t.palette.positive_50}]}>
          <TrendingIcon size="sm" style={{color: t.palette.positive_700}} />
          <Text style={[textStyle, {color: t.palette.positive_700}]}>
            <Trans>New</Trans>
          </Text>
        </View>
      )
    }
    case 'skeleton': {
      return (
        <View
          style={[
            pillStyle,
            {backgroundColor: t.palette.contrast_25, width: 65, height: 28},
          ]}
        />
      )
    }
    default: {
      return (
        <View style={[pillStyle, t.atoms.bg_contrast_25]}>
          <Text style={[textStyle, t.atoms.text_contrast_medium]}>
            <Trans comment="trending topic time spent trending. should be as short as possible to fit in a pill">
              {type}h ago
            </Trans>
          </Text>
        </View>
      )
    }
  }
}

export function TrendingTopicRowSkeleton({}: {withPosts: boolean}) {
  const gutters = useGutters([0, 'base'])

  return (
    <View style={[a.flex_1, a.flex_row, a.gap_xs, gutters, a.py_md]}>
      <View style={[a.flex_shrink_0, {minWidth: 20}]}>
        <LoadingPlaceholder width={16} height={16} />
      </View>
      <View style={[a.flex_1, a.flex_row, a.gap_sm, a.justify_between]}>
        <View style={[a.flex_1]}>
          <LoadingPlaceholder width={150} height={16} />
          <View style={[a.mt_sm, a.flex_row, a.gap_sm, a.align_center]}>
            <LoadingPlaceholder width={35} height={14} />
            <LoadingPlaceholder width={45} height={14} />
            <LoadingPlaceholder width={25} height={14} />
          </View>
        </View>
        <View style={[a.flex_shrink_0]}>
          <TrendingIndicator type="skeleton" />
        </View>
      </View>
    </View>
  )
}

// ==== LEGACY PILL FORM ====

export function TrendingTopicPill({
  topic: raw,
  size,
  style,
}: {topic: TrendingTopic; size?: 'large' | 'small'} & ViewStyleProp) {
  const t = useTheme()
  const topic = useTopic(raw)

  const isSmall = size === 'small'
  const hasIcon = topic.type === 'starter-pack' && !isSmall
  const iconSize = 20

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
          a.font_bold,
          a.leading_tight,
          isSmall ? [a.text_sm] : [a.text_md, {paddingBottom: 1}],
        ]}
        numberOfLines={1}>
        {topic.displayName}
      </Text>
    </View>
  )
}

export function TrendingTopicPillSkeleton({
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

// TEMP
function useTempData() {
  const description = useMemo(() => {
    const category = [
      'News',
      'Sports',
      'Entertainment',
      'Politics',
      'Politics',
    ][Math.floor(Math.random() * 5)]
    return <>4,321 posts &middot; {category}</>
  }, [])
  const randomProfiles = useMemo(() => {
    let tempRandomProfiles = [
      'pfrazee.com',
      'esb.lol',
      'hailey.at',
      'jay.bsky.team',
      'jcsalterego.bsky.social',
      'jaz.bsky.social',
      'divy.zone',
      'chadbourn.bsky.social',
      'barackobama.bsky.social',
      'retr0.id',
      'atrupar.com',
    ]
    return Array.from({length: 3}, () => {
      const random =
        tempRandomProfiles[
          Math.floor(Math.random() * tempRandomProfiles.length)
        ]
      tempRandomProfiles = tempRandomProfiles.filter(
        profile => profile !== random,
      )
      return random
    })
  }, [])
  return {
    description,
    randomProfiles,
  }
}
