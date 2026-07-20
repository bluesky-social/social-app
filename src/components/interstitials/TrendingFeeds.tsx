import {useMemo} from 'react'
import {Pressable, View} from 'react-native'
import {type AppBskyUnspeccedDefs, moderateProfile} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useTrendingSettings} from '#/state/preferences/trending'
import {useGetTrendsQuery} from '#/state/queries/trending/useGetTrendsQuery'
import {useTrendingConfig} from '#/state/service-config'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {
  atoms as a,
  useGutters,
  useLayoutBreakpoints,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from '#/components/icons/Trending'
import {Link} from '#/components/Link'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const TOPIC_COUNT = 3

export function TrendingFeedsInterstitial() {
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
          <TrendingIcon width={18} fill={t.atoms.text.color} />
          <Text
            style={[a.text_md, a.font_medium, a.leading_snug]}
            numberOfLines={1}>
            <Trans>Trending</Trans>
          </Text>
        </View>
        <Link label={l`See more trending topics`} to="/search">
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}
            numberOfLines={1}>
            <Trans>See more</Trans>
          </Text>
        </Link>
      </View>
      <View
        style={[
          a.relative,
          a.z_10,
          a.rounded_xl,
          t.atoms.bg,
          {
            borderColor: t.palette.primary_100,
            borderWidth: 0.5,
            boxShadow: `0 0 16px 0 ${t.palette.primary_100}`,
            elevation: 8,
            shadowColor: t.palette.primary_100,
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
  const {t: l} = useLingui()

  const actors = useModerateTrendingActors(trend.actors)

  return (
    <Link
      testID={trend.link}
      label={l`Browse topic ${trend.displayName}`}
      to={trend.link}
      onPress={onPress}
      style={[rank < TOPIC_COUNT && a.border_b, t.atoms.border_contrast_low]}
      PressableComponent={Pressable}>
      {({hovered, pressed}) => (
        <>
          <SubtleHover hover={hovered || pressed} native />
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.flex_row,
              t.atoms.border_contrast_low,
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
              <AvatarStack size={24} profiles={actors} />
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
