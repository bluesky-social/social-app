import {useMemo} from 'react'
import {Pressable, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {type AppBskyUnspeccedDefs, moderateProfile} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useTrendingSettings} from '#/state/preferences/trending'
import {useGetTrendsQuery} from '#/state/queries/trending/useGetTrendsQuery'
import {useTrendingConfig} from '#/state/service-config'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {formatCount} from '#/view/com/util/numeric/format'
import {
  atoms as a,
  useGutters,
  useLayoutBreakpoints,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {alpha} from '#/alf/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from '#/components/icons/Trending'
import {Link} from '#/components/Link'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const TOPIC_COUNT = 3

export function FeedTrendingTopicsInterstitial() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  const {rightNavVisible} = useLayoutBreakpoints()

  return enabled && !trendingDisabled && !rightNavVisible ? <Inner /> : null
}

function Inner() {
  const t = useTheme()
  const {t: l} = useLingui()
  const gutters = useGutters([0, 'base'])
  const ax = useAnalytics()
  const {
    data: trending,
    error,
    isLoading,
    isRefetching,
  } = useGetTrendsQuery({limit: TOPIC_COUNT})
  const noTopics = !isLoading && !error && !trending?.trends?.length

  const shadowColor = alpha(t.palette.primary_100, 0.5)

  const gradient = {
    values: [
      [0, t.atoms.bg.backgroundColor],
      [0.1, t.palette.primary_25],
      [0.9, t.palette.primary_25],
      [1, t.atoms.bg.backgroundColor],
    ],
    hover_value: t.palette.white,
  }

  if (error || noTopics) {
    return null
  }

  return (
    <View
      style={[
        gutters,
        a.pt_lg,
        a.pb_xl,
        a.gap_sm,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <LinearGradient
        colors={gradient.values.map(c => c[1]) as [string, string, ...string[]]}
        locations={
          gradient.values.map(c => c[0]) as [number, number, ...number[]]
        }
        style={[a.absolute, a.inset_0]}
      />
      <View
        style={[
          a.relative,
          a.z_20,
          a.px_xs,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_sm,
        ]}>
        <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_xs]}>
          <TrendingIcon width={18} />
          <Text
            style={[a.text_md, a.font_medium, a.leading_snug]}
            numberOfLines={1}>
            <Trans>Trending</Trans>
          </Text>
        </View>
        <Link label={l`See more trending topics`} to="/search">
          <Text
            style={[
              a.text_sm,
              a.font_medium,
              a.leading_snug,
              t.atoms.text_contrast_high,
            ]}
            numberOfLines={1}>
            <Trans>See more</Trans>
          </Text>
        </Link>
      </View>
      <View
        style={[
          a.relative,
          a.z_10,
          a.border,
          a.rounded_xl,
          t.atoms.bg,
          {
            borderColor: t.palette.primary_100,
            boxShadow: `0 0 16px 0 ${shadowColor}`,
            elevation: 8,
            shadowColor: shadowColor,
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 1,
            shadowRadius: 16,
          },
        ]}>
        {isLoading || isRefetching
          ? Array.from({length: TOPIC_COUNT}).map((_, i) => (
              <TrendingTopicRowSkeleton key={i} rank={i + 1} />
            ))
          : trending?.trends?.map((trend, index) => (
              <TrendRow
                key={trend.link}
                trend={trend}
                rank={index + 1}
                onPress={() => {
                  ax.metric('trendingTopic:click', {context: 'interstitial'})
                }}
              />
            ))}
      </View>
    </View>
  )
}

function TrendRow({
  trend,
  rank,
  onPress,
}: ViewStyleProp & {
  trend: AppBskyUnspeccedDefs.TrendView
  rank: number
  children?: React.ReactNode
  onPress?: () => void
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()

  const actors = useModerateTrendingActors(trend.actors)

  return (
    <Link
      testID={trend.link}
      label={l`Browse topic ${trend.displayName}`}
      to={trend.link}
      onPress={onPress}
      style={[
        rank < TOPIC_COUNT && a.border_b,
        {
          borderColor: t.palette.primary_100,
        },
      ]}
      PressableComponent={Pressable}>
      {({hovered, pressed}) => (
        <>
          <SubtleHover hover={hovered || pressed} native />
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.flex_row,
              {
                gap: 6,
                padding: 14,
                paddingLeft: 16,
              },
            ]}>
            <Text
              style={[
                a.text_md,
                a.font_semi_bold,
                t.atoms.text_contrast_low,
                {
                  fontVariant: ['tabular-nums'],
                },
              ]}>
              <Trans comment='The trending topic rank, i.e. "1. March Madness", "2. The Bachelor"'>
                {rank}.
              </Trans>
            </Text>
            <View style={[a.flex_1, a.gap_xs]}>
              <Text style={[a.text_md, a.font_medium]} numberOfLines={1}>
                {trend.displayName}
              </Text>
              <View style={[a.flex_row, a.gap_sm, a.align_center]}>
                {actors.length > 0 ? (
                  <AvatarStack size={24} profiles={actors} />
                ) : null}
                <Text
                  style={[a.text_sm, t.atoms.text_contrast_medium]}
                  numberOfLines={1}>
                  <Trans comment="'{postCount} {posts}', e.g., '1.2K posts'">
                    {formatCount(i18n, trend.postCount)}{' '}
                    {plural(trend.postCount, {one: 'post', other: 'posts'})}
                  </Trans>
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </Link>
  )
}
function TrendingTopicRowSkeleton({rank}: {rank: number}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.px_lg,
        a.py_lg,
        a.flex_row,
        rank < TOPIC_COUNT && a.border_b,
        t.atoms.border_contrast_low,
        {
          gap: 6,
        },
      ]}>
      <LoadingPlaceholder width={17} height={17} style={[a.rounded_full]} />
      <View style={[a.flex_1, a.gap_xs]}>
        <View style={[a.flex_row, a.gap_sm, a.align_center]}>
          <LoadingPlaceholder width={70} height={17} />
          <LoadingPlaceholder width={40} height={17} />
          <LoadingPlaceholder width={60} height={17} />
        </View>
        <LoadingPlaceholder width={24} height={24} style={[a.rounded_full]} />
      </View>
    </View>
  )
}

function useModerateTrendingActors(
  actors: AppBskyUnspeccedDefs.TrendView['actors'],
) {
  const moderationOpts = useModerationOpts()

  return useMemo(() => {
    if (!moderationOpts) return []

    return actors
      .filter(actor => {
        const decision = moderateProfile(actor, moderationOpts)
        return !decision.ui('avatar').filter && !decision.ui('avatar').blur
      })
      .slice(0, 3)
  }, [actors, moderationOpts])
}
