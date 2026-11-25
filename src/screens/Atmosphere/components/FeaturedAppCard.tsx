import {StyleSheet, View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {type AppMetric} from '#/screens/Atmosphere/metrics/apps'
import {useAtmosphereMetricContext} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {type ItemFocusProps} from '#/components/Gallery'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Square'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {useAtmosphereAppCategories} from './appCategories'
import {AppKnownFollowers} from './AppKnownFollowers'

const LOGO_SIZE = 56
const BACKGROUND_BLUR_RADIUS = 50
const CARD_RADIUS = 24
/** Darkens the blurred cover enough for white text on any image. */
const SCRIM = 'rgba(0, 0, 0, 0.55)'
/** A faint white sheen and edge that give the card its glassy look. */
const SHEEN_TOP = 'rgba(255, 255, 255, 0.10)'
const SHEEN_BOTTOM = 'rgba(255, 255, 255, 0)'
const GLASS_BORDER = 'rgba(255, 255, 255, 0.14)'
const GLASS_BUTTON = 'rgba(255, 255, 255, 0.14)'

/**
 * Featured app card: dark, frosted glass over the app's blurred cover image, in
 * every app theme, so it stands out from the surrounding Explore content. Only
 * its links are interactive.
 */
export function FeaturedAppCard({
  app,
  metric,
  galleryFocus,
}: {
  app: FeaturedApp
  metric: AppMetric
  galleryFocus?: ItemFocusProps
}) {
  return (
    <ThemeProvider theme="dark">
      <CardContent app={app} metric={metric} galleryFocus={galleryFocus} />
    </ThemeProvider>
  )
}

/** Separate from the card so its tokens come from the dark theme. */
function CardContent({
  app,
  metric,
  galleryFocus,
}: {
  app: FeaturedApp
  metric: AppMetric
  galleryFocus?: ItemFocusProps
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
        {
          borderRadius: CARD_RADIUS,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: GLASS_BORDER,
        },
      ]}>
      <Image
        source={app.backgroundImage}
        contentFit="cover"
        blurRadius={BACKGROUND_BLUR_RADIUS}
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
      <View style={[StyleSheet.absoluteFill, {backgroundColor: SCRIM}]} />
      <LinearGradient
        colors={[SHEEN_TOP, SHEEN_BOTTOM]}
        start={{x: 0, y: 0}}
        end={{x: 0.6, y: 0.6}}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
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
          {profile ? <AppKnownFollowers profile={profile} /> : undefined}
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
              <ButtonText>{l`Visit site`}</ButtonText>
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
              style={[
                a.flex_1,
                a.justify_center,
                {backgroundColor: GLASS_BUTTON},
              ]}
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
