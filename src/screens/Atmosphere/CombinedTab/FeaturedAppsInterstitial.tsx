import {View} from 'react-native'
import {Image} from 'expo-image'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useAtmosphereAppCategories} from '#/screens/Atmosphere/components/appCategories'
import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {
  type FeaturedApp,
  getAtmosphereExploreApps,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {type AppMetric, getAppMetric} from '#/screens/Atmosphere/metrics/apps'
import {useAtmosphereMetricContext} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Gallery from '#/components/Gallery'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Square'
import {Window_Stroke2_Corner2_Rounded as AppsIcon} from '#/components/icons/Window'
import {Link} from '#/components/Link'
import * as Skeleton from '#/components/Skeleton'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const CARD_WIDTH = 320
const LOGO_SIZE = 56

/**
 * Explore's featured apps, with a skeleton while they load. Uses Explore's
 * query for now, so whichever tab loads first fills the other.
 */
export function FeaturedAppsInterstitial({
  onPressSeeMore,
}: {
  onPressSeeMore?: () => void
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const {data, isPending} = useAtmosphereExploreQuery()
  const apps = data ? getAtmosphereExploreApps(data) : []
  const onPressSeeMoreWithMetric =
    onPressSeeMore &&
    (() => {
      if (metricContext) {
        ax.metric('atmosphere:section:seeMore', {
          ...metricContext,
          section: 'apps',
          destinationTab: 'apps',
        })
      }
      onPressSeeMore()
    })

  if (!isPending && !apps.length) return null

  const header = (
    <FeaturedAppsHeader onPressViewAll={onPressSeeMoreWithMetric} />
  )

  return (
    <Gallery.Bleed>
      <View
        testID="combinedFeaturedApps"
        style={[
          a.py_lg,
          a.my_sm,
          a.border_y,
          t.atoms.border_contrast_low,
          t.atoms.bg_contrast_25,
        ]}>
        {isPending ? (
          <FeaturedAppsSkeleton header={header} />
        ) : (
          <FeaturedApps apps={apps} header={header} />
        )}
      </View>
    </Gallery.Bleed>
  )
}

function FeaturedAppsHeader({onPressViewAll}: {onPressViewAll?: () => void}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_md]}>
      <View style={[a.flex_row, a.flex_1, a.align_center, a.gap_xs]}>
        <AppsIcon size="sm" fill={t.palette.primary_500} />
        <Text
          accessibilityRole="header"
          style={[a.flex_shrink, a.text_sm, a.font_semi_bold, a.leading_snug]}>
          <Trans>Featured apps</Trans>
        </Text>
      </View>
      {onPressViewAll ? (
        <Button
          testID="combinedFeaturedAppsViewAll"
          label={l`View all apps`}
          onPress={onPressViewAll}
          hitSlop={HITSLOP_10}
          style={[a.flex_row, a.align_center, a.gap_2xs]}>
          {({hovered}) => (
            <>
              <Text
                style={[
                  a.text_sm,
                  a.font_medium,
                  {color: t.palette.primary_500},
                  hovered && a.underline,
                ]}>
                <Trans>View all</Trans>
              </Text>
              <ArrowRightIcon size="xs" fill={t.palette.primary_500} />
            </>
          )}
        </Button>
      ) : undefined}
    </View>
  )
}

/** Lays out like the loaded carousel, so nothing jumps when it loads. */
function FeaturedAppsSkeleton({header}: {header: React.ReactNode}) {
  const {t: l} = useLingui()

  return (
    <View
      testID="combinedFeaturedAppsSkeleton"
      accessibilityRole="progressbar"
      accessibilityLabel={l`Loading featured apps`}
      accessibilityHint=""
      style={a.overflow_hidden}>
      <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
        {header}
        <View style={[a.flex_row, a.gap_sm]}>
          <AppCardSkeleton />
          <AppCardSkeleton />
        </View>
      </View>
    </View>
  )
}

function AppCardSkeleton() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_shrink_0,
        a.p_lg,
        a.gap_md,
        t.atoms.bg,
        {width: CARD_WIDTH, borderRadius: 24},
      ]}>
      <Skeleton.Block style={[a.w_full, a.rounded_lg, {aspectRatio: 3}]} />
      <View style={[a.flex_row, a.align_center, a.gap_md, a.pt_xs]}>
        <Skeleton.Block style={{width: LOGO_SIZE, height: LOGO_SIZE}} />
        <Skeleton.Col style={[a.gap_2xs]}>
          <Skeleton.Text style={[a.text_lg, {width: 120}]} />
          <Skeleton.Text style={[a.text_sm, {width: 160}]} />
        </Skeleton.Col>
      </View>
      <View style={[a.gap_sm]}>
        <View>
          <Skeleton.Text style={[a.text_sm, a.w_full]} />
          <Skeleton.Text style={[a.text_sm, {width: 180}]} />
        </View>
        <Skeleton.Row style={[a.align_center, a.gap_xs]}>
          <Skeleton.Circle size={18} />
          <Skeleton.Text style={[a.text_xs, {width: 160}]} />
        </Skeleton.Row>
      </View>
      <View style={[a.flex_row, a.gap_sm, a.pt_xs]}>
        <Skeleton.Block style={[a.flex_1, a.rounded_full, {height: 33}]} />
        <Skeleton.Block style={[a.flex_1, a.rounded_full, {height: 33}]} />
      </View>
    </View>
  )
}

function FeaturedApps({
  apps,
  header,
}: {
  apps: FeaturedApp[]
  header: React.ReactNode
}) {
  const {t: l} = useLingui()

  if (!apps.length) return null

  return (
    <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      {header}
      <Gallery.Root
        snapToItems
        stretch
        label={l`Featured apps`}
        testID="atmosphereAppsGallery">
        {apps.map((app, index) => {
          const metric = {
            ...getAppMetric({app, position: index}),
            hasSocialProof:
              app.profile?.followersCount != null ||
              !!app.profile?.viewer?.knownFollowers?.followers.length,
          }
          return (
            <Gallery.Item key={app.id} label={app.title}>
              {galleryFocus => (
                <View style={[a.flex_grow]}>
                  <View style={[a.flex_grow, {width: CARD_WIDTH}]}>
                    <FeaturedAppCard
                      app={app}
                      metric={metric}
                      galleryFocus={galleryFocus}
                    />
                  </View>
                </View>
              )}
            </Gallery.Item>
          )
        })}
      </Gallery.Root>
    </View>
  )
}

/** Featured app card. Only its links are interactive. */
function FeaturedAppCard({
  app,
  metric,
  galleryFocus,
}: {
  app: FeaturedApp
  metric: AppMetric
  galleryFocus?: Gallery.ItemFocusProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const logPress = (
    event: 'atmosphere:app:websitePressed' | 'atmosphere:app:profilePressed',
  ) => {
    if (!metricContext) return
    ax.metric(event, {...metricContext, ...metric, source: 'featuredCard'})
  }
  const categories = useAtmosphereAppCategories()
  const categoryLabel = categories.find(({key}) => key === app.category)?.label
  const profile = app.profile
  const knownFollowers = profile?.viewer?.knownFollowers?.followers ?? []
  const {title} = app
  const subtitle = [app.url && toNiceDomain(app.url), categoryLabel]
    .filter(Boolean)
    .join(' · ')

  return (
    <View
      style={[
        a.flex_grow,
        a.w_full,
        a.overflow_hidden,
        t.atoms.bg,
        {borderRadius: 24},
      ]}>
      <View style={[a.flex_grow, a.p_lg, a.gap_md]}>
        <Image
          source={app.backgroundImage}
          contentFit="cover"
          style={[a.w_full, a.rounded_lg, {aspectRatio: 3}]}
          accessible={false}
        />
        <View style={[a.flex_row, a.align_center, a.gap_md, a.pt_xs]}>
          {app.logo ? (
            <Image
              source={app.logo}
              contentFit="cover"
              style={[a.rounded_md, {width: LOGO_SIZE, height: LOGO_SIZE}]}
              accessible={false}
            />
          ) : undefined}
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text
              emoji
              style={[a.text_lg, a.font_semi_bold, a.leading_snug]}
              numberOfLines={1}>
              {app.title}
            </Text>
            {subtitle ? (
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                {app.url ? (
                  <ExternalLinkIcon
                    size="xs"
                    fill={t.atoms.text_contrast_medium.color}
                  />
                ) : undefined}
                <Text
                  emoji
                  style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}
                  numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            ) : undefined}
          </View>
        </View>
        <View style={[a.gap_sm]}>
          {app.description ? (
            <Text
              emoji
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}
              numberOfLines={2}>
              {app.description}
            </Text>
          ) : undefined}
          {profile?.followersCount != null || knownFollowers.length > 0 ? (
            <View
              style={[
                a.flex_row,
                a.flex_shrink,
                a.align_center,
                {gap: 5},
                knownFollowers.length > 0 && {marginLeft: -1},
              ]}>
              {knownFollowers.length > 0 ? (
                <AvatarStack profiles={knownFollowers.slice(0, 3)} size={18} />
              ) : undefined}
              {profile?.followersCount != null ? (
                <Text
                  style={[
                    a.flex_shrink,
                    a.text_xs,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={1}>
                  <Plural
                    value={profile.followersCount}
                    one="# follower on Bluesky"
                    other="# followers on Bluesky"
                  />
                </Text>
              ) : undefined}
            </View>
          ) : undefined}
        </View>
        <View style={[a.flex_row, a.gap_sm, a.pt_xs, a.mt_auto]}>
          {app.url ? (
            <Link
              testID="featuredAppVisit"
              to={app.url}
              label={l`Visit the ${title} website`}
              size="small"
              color="secondary_inverted"
              style={[a.flex_1, a.justify_center]}
              onPress={() => logPress('atmosphere:app:websitePressed')}
              ref={galleryFocus?.focusRef}
              tabIndex={galleryFocus?.tabIndex}
              onFocus={galleryFocus?.onFocus}>
              <ButtonText>{l`Website`}</ButtonText>
              <ButtonIcon icon={ExternalLinkIcon} />
            </Link>
          ) : undefined}
          {profile ? (
            <Link
              testID="featuredAppProfile"
              to={makeProfileLink(profile)}
              label={l`View ${title} profile`}
              size="small"
              color="secondary"
              style={[a.flex_1, a.justify_center]}
              onPress={() => logPress('atmosphere:app:profilePressed')}
              ref={app.url ? undefined : galleryFocus?.focusRef}
              tabIndex={galleryFocus?.tabIndex}
              onFocus={galleryFocus?.onFocus}>
              <ButtonText>{l`View profile`}</ButtonText>
            </Link>
          ) : undefined}
        </View>
      </View>
    </View>
  )
}
