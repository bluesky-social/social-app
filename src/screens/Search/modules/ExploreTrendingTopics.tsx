import {useMemo} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {
  type AppBskyUnspeccedDefs,
  moderateProfile,
  RichText as RichTextApi,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useTrendingSettings} from '#/state/preferences/trending'
import {useGetTrendsQuery} from '#/state/queries/trending/useGetTrendsQuery'
import {useTrendingConfig} from '#/state/service-config'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useGutters, useTheme, type ViewStyleProp} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from '#/components/icons/Trending'
import {Link} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import * as ModuleHeader from '../components/ModuleHeader'

const TOPIC_COUNT = 5

const IMAGE_SIZE = 56

export function ExploreTrendingTopics() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return enabled && !trendingDisabled ? <Inner /> : null
}

function Inner() {
  const ax = useAnalytics()
  const {data: trending, error, isLoading, isRefetching} = useGetTrendsQuery()
  const noTopics = !isLoading && !error && !trending?.trends?.length
  const showLoading = isLoading || isRefetching

  if (!showLoading && (error || !trending?.trends || noTopics)) return null

  return (
    <View style={[a.pb_md]}>
      <ModuleHeader.Container bottomBorder>
        <ModuleHeader.Icon icon={TrendingIcon} size="md" />
        <ModuleHeader.TitleText>
          <Trans>Trending</Trans>
        </ModuleHeader.TitleText>
      </ModuleHeader.Container>
      {showLoading
        ? Array.from({length: TOPIC_COUNT}).map((__, i) => (
            <TrendingTopicRowSkeleton key={i} />
          ))
        : trending?.trends.map((trend, index) => (
            <TrendRow
              key={trend.link}
              trend={trend}
              rank={index + 1}
              onPress={() => {
                ax.metric('trendingTopic:click', {
                  context: 'explore',
                  recId: trending.recId,
                })
              }}
            />
          ))}
    </View>
  )
}

export function TrendRow({
  trend,
  rank,
  children,
  onPress,
}: ViewStyleProp & {
  trend: AppBskyUnspeccedDefs.TrendView
  rank: number
  children?: React.ReactNode
  onPress?: () => void
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const gutters = useGutters([0, 'base'])

  const actors = useModerateTrendingActors(trend.actors)

  const description = useMemo(() => {
    if (!trend.description) return
    const rt = new RichTextApi({text: trend.description})
    rt.detectFacetsWithoutResolution()
    return rt
  }, [trend.description])

  let imageUrl = null // TODO Image URL goes here when available. -dsb

  return (
    <Link
      testID={trend.link}
      label={l`Browse topic ${trend.displayName}`}
      to={trend.link}
      onPress={onPress}
      style={[a.border_b, t.atoms.border_contrast_low]}
      PressableComponent={Pressable}>
      {({hovered, pressed}) => (
        <>
          <SubtleHover hover={hovered || pressed} native />
          <View style={[gutters, a.w_full, a.flex_row, a.py_md, a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_medium,

                t.atoms.text_contrast_low,
                {
                  fontVariant: ['tabular-nums'],
                },
              ]}>
              <Trans comment='The trending topic rank, i.e. "1. March Madness", "2. The Bachelor"'>
                {rank}.
              </Trans>
            </Text>
            <View style={[a.flex_1, a.gap_2xs]}>
              <Text
                style={[a.text_sm, a.font_semi_bold, a.leading_snug]}
                numberOfLines={1}>
                {trend.displayName}
              </Text>
              {description ? (
                <RichText
                  value={description}
                  disableLinks
                  style={[a.text_sm, t.atoms.text_contrast_medium]}
                  numberOfLines={2}
                />
              ) : null}
              <View style={[a.mt_xs, a.flex_row, a.gap_sm, a.align_center]}>
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
            {imageUrl ? (
              <Image
                source={{
                  uri: imageUrl,
                }}
                alt={trend.topic}
                style={[
                  a.flex_0,
                  a.rounded_md,
                  t.atoms.bg_contrast_25,
                  {
                    width: IMAGE_SIZE,
                    height: IMAGE_SIZE,
                  },
                ]}
                contentFit="cover"
                accessible={true}
                accessibilityIgnoresInvertColors
                useAppleWebpCodec
              />
            ) : null}
          </View>
          {children}
        </>
      )}
    </Link>
  )
}

// Unused atm, but leaving here so we don't lose localization. -dsb
export function useCategoryDisplayName(
  category: AppBskyUnspeccedDefs.TrendView['category'],
) {
  const {t: l} = useLingui()

  switch (category) {
    case 'sports':
      return l`Sports`
    case 'politics':
      return l`Politics`
    case 'video-games':
      return l`Video Games`
    case 'pop-culture':
      return l`Entertainment`
    case 'news':
      return l`News`
    case 'other':
    default:
      return null
  }
}

export function TrendingTopicRowSkeleton() {
  const t = useTheme()
  const gutters = useGutters([0, 'base'])

  return (
    <View
      style={[
        gutters,
        a.w_full,
        a.py_md,
        a.flex_row,
        a.gap_sm,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[{width: 20}]}>
        <LoadingPlaceholder width={17} height={17} style={[a.rounded_full]} />
      </View>
      <View style={[a.flex_1, a.gap_2xs]}>
        <LoadingPlaceholder width={90} height={17} />
        <View style={[a.flex_row, a.gap_sm, a.align_center]}>
          <LoadingPlaceholder width={70} height={16} />
          <LoadingPlaceholder width={40} height={16} />
          <LoadingPlaceholder width={60} height={16} />
        </View>
        <View style={[a.flex_row, a.gap_sm, a.align_center]}>
          <LoadingPlaceholder width={50} height={16} />
          <LoadingPlaceholder width={70} height={16} />
          <LoadingPlaceholder width={30} height={16} />
        </View>
        <View style={[a.flex_1, a.gap_sm]}>
          <View style={[a.mt_xs, a.flex_row, a.gap_sm, a.align_center]}>
            <LoadingPlaceholder
              width={24}
              height={24}
              style={[a.rounded_full]}
            />
            <LoadingPlaceholder width={60} height={16} />
          </View>
        </View>
      </View>
      {/* TODO Image placeholder goes here when images are available. -dsb */}
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
