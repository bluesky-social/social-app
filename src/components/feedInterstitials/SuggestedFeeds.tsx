import React from 'react'
import {View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {atoms as a, useBreakpoints, useTheme, ViewStyleProp} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ArrowRight_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        !gtMobile && {
          width: 300,
        },
        {
          borderColor: t.atoms.bg_contrast_25.backgroundColor,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowCardSkeleton() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_sm, t.atoms.border_contrast_low]}>
      <FeedCard.Header>
        <FeedCard.AvatarPlaceholder />
        <FeedCard.TitleAndBylinePlaceholder />
      </FeedCard.Header>

      <FeedCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

export function ErrorState({retry}: {retry: () => void}) {
  const t = useTheme()
  return (
    <>
      <CardOuter>
        <CircleInfo size="lg" fill={t.palette.negative_400} />
        <Text style={[a.font_bold]}>Whoops, something went wrong :(</Text>
        <Button
          label={'Retry'}
          size="small"
          variant="ghost"
          color="secondary"
          onPress={retry}>
          <ButtonText>Retry</ButtonText>
          <ButtonIcon icon={Refresh} position="right" />
        </Button>
      </CardOuter>

      <SuggestedFollowCardSkeleton />
      <SuggestedFollowCardSkeleton />
    </>
  )
}

export function SuggestedFeedsCards() {
  const t = useTheme()
  const {_} = useLingui()
  const {
    data,
    isLoading: isLoadingFeeds,
    error,
    refetch,
  } = useGetPopularFeedsQuery({limit: 3})
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()
  const isLoading = isLoadingFeeds || !moderationOpts

  const feeds = React.useMemo(() => {
    const items: AppBskyFeedDefs.GeneratorView[] = []

    if (!data) return items

    for (const page of data.pages) {
      for (const feed of page.feeds) {
        items.push(feed)
      }
    }

    return items
  }, [data])

  const content = isLoading ? (
    Array(3)
      .fill(0)
      .map((_, i) => <SuggestedFollowCardSkeleton key={i} />)
  ) : error || !feeds ? (
    <ErrorState retry={refetch} />
  ) : (
    <>
      {feeds.map(feed => (
        <FeedCard.Link key={feed.uri} type="feed" view={feed}>
          <CardOuter style={[a.flex_1]}>
            <FeedCard.Outer>
              <FeedCard.Header>
                <FeedCard.Avatar src={feed.avatar} />
                <FeedCard.TitleAndByline
                  title={feed.displayName}
                  creator={feed.creator}
                  type="feed"
                />
                <FeedCard.Action pin type="feed" uri={feed.uri} />
              </FeedCard.Header>
              <FeedCard.Description
                description={feed.description}
                numberOfLines={3}
              />
            </FeedCard.Outer>
          </CardOuter>
        </FeedCard.Link>
      ))}
    </>
  )

  return gtMobile ? (
    <View style={[a.flex_1, a.px_lg, a.pt_md, a.pb_xl, a.gap_md]}>
      {content}
    </View>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
        {content}

        <Button
          label={_(msg`Browse more accounts on our explore page`)}
          onPress={() => {
            navigation.navigate('SearchTab')
          }}>
          <CardOuter
            style={[a.flex_1, t.atoms.bg_contrast_25, {borderWidth: 0}]}>
            <View style={[a.flex_1, a.justify_center]}>
              <View style={[a.flex_row, a.px_lg]}>
                <Text style={[a.pr_xl, a.flex_1, a.leading_snug]}>
                  <Trans>Browse more suggestions on our explore page</Trans>
                </Text>

                <Arrow size="xl" />
              </View>
            </View>
          </CardOuter>
        </Button>
      </View>
    </ScrollView>
  )
}
