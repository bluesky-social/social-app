import {useMemo} from 'react'
import {Pressable, View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
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
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from '#/components/icons/Trending'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {SubtleHover} from '#/components/SubtleHover'
import {useTrendingTopicSeen} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'

const TOPIC_COUNT = 3

export function FeedTrendingTopicsInterstitial({
  feedSliceIndex,
}: {
  feedSliceIndex: number
}) {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  const {rightNavVisible} = useLayoutBreakpoints()

  return enabled && !trendingDisabled && !rightNavVisible ? (
    <Inner feedSliceIndex={feedSliceIndex} />
  ) : null
}

function Inner({feedSliceIndex}: {feedSliceIndex: number}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const gutters = useGutters([0, 'base'])
  const ax = useAnalytics()
  const trendingPrompt = Prompt.usePromptControl()
  const {setTrendingDisabled} = useTrendingSettingsApi()
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
    <>
      <View
        style={[
          gutters,
          a.pt_xs,
          a.pb_lg,
          a.gap_xs,
          a.border_t,
          t.atoms.border_contrast_low,
          t.atoms.bg_contrast_25,
        ]}>
        <View
          style={[
            a.relative,
            a.z_20,
            a.pl_xs,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_sm,
          ]}>
          <View
            style={[a.flex_row, a.align_center, a.justify_between, a.gap_xs]}>
            <TrendingIcon width={18} fill={t.atoms.text.color} />
            <Text style={[a.text_md, a.font_medium]} numberOfLines={1}>
              <Trans>Trending</Trans>
            </Text>
          </View>
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <Link label={l`See more trending topics`} to="/search">
              {({hovered, pressed}) => (
                <Text
                  style={[
                    a.text_sm,
                    a.font_medium,
                    {
                      color:
                        hovered || pressed
                          ? t.palette.contrast_800
                          : t.palette.contrast_500,
                    },
                  ]}
                  numberOfLines={1}>
                  <Trans>See more</Trans>
                </Text>
              )}
            </Link>
            <Button
              variant="ghost"
              size="medium"
              color="secondary"
              shape="round"
              label={l`Trending options`}
              onPress={() => trendingPrompt.open()}
              style={[a.bg_transparent]}>
              <ButtonIcon icon={EllipsisIcon} size="md" />
            </Button>
          </View>
        </View>
        <View style={[a.relative, a.z_10, a.rounded_xl, t.atoms.shadow_md]}>
          <View
            style={[
              a.overflow_hidden,
              a.border,
              a.rounded_xl,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            {isLoading || isRefetching
              ? Array.from({length: TOPIC_COUNT}).map((_, i) => (
                  <TrendingTopicRowSkeleton key={i} rank={i + 1} />
                ))
              : trending?.trends?.map((trend, index) => {
                  const rank = index + 1
                  return (
                    <TrendRow
                      key={trend.link}
                      trend={trend}
                      rank={rank}
                      feedSliceIndex={feedSliceIndex}
                      recId={trending.recId}
                      onPress={() => {
                        ax.metric('trendingTopic:click', {
                          context: 'interstitial',
                          rank,
                          feedSliceIndex,
                          recId: trending.recId,
                        })
                      }}
                    />
                  )
                })}
          </View>
        </View>
      </View>
      <Prompt.Basic
        control={trendingPrompt}
        title={l`Hide trending topics?`}
        description={l`You can update this later from your settings.`}
        confirmButtonCta={l`Hide`}
        onConfirm={() => {
          ax.metric('trendingTopics:hide', {context: 'interstitial'})
          setTrendingDisabled(true)
        }}
      />
    </>
  )
}

function TrendRow({
  trend,
  rank,
  feedSliceIndex,
  recId,
  onPress,
}: ViewStyleProp & {
  trend: app.bsky.unspecced.defs.TrendView
  rank: number
  feedSliceIndex: number
  recId?: string
  children?: React.ReactNode
  onPress?: () => void
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()

  const actors = useModerateTrendingActors(trend.actors)
  const formattedPostCount = formatCount(i18n, trend.postCount)
  useTrendingTopicSeen('interstitial', rank, recId, feedSliceIndex)

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
              <Text style={[a.text_md, a.font_medium]} numberOfLines={2}>
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
                    {formattedPostCount}{' '}
                    <Plural
                      value={{postCount: trend.postCount}}
                      one="post"
                      other="posts"
                    />
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
  actors: app.bsky.unspecced.defs.TrendView['actors'],
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
