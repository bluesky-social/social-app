import {StyleSheet, View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {type ItemFocusProps} from '#/components/Gallery'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Square'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAtmosphereAppCategories} from './appCategories'
import {AppKnownFollowers} from './AppKnownFollowers'

const LOGO_SIZE = 56
const BACKGROUND_BLUR_RADIUS = 50

/**
 * Featured app card. Always renders in the opposite of the current theme so it
 * stands out from the surrounding Explore content. Only its links are
 * interactive.
 */
export function FeaturedAppCard({
  app,
  galleryFocus,
}: {
  app: FeaturedApp
  galleryFocus?: ItemFocusProps
}) {
  const t = useTheme()

  return (
    <ThemeProvider theme={t.name === 'light' ? 'dark' : 'light'}>
      <CardContent app={app} galleryFocus={galleryFocus} />
    </ThemeProvider>
  )
}

/** Separate from the card so its tokens come from the inverted theme. */
function CardContent({
  app,
  galleryFocus,
}: {
  app: FeaturedApp
  galleryFocus?: ItemFocusProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const categories = useAtmosphereAppCategories()
  const categoryLabel = categories.find(({key}) => key === app.category)?.label
  const profile = app.profile
  const {title} = app
  const isLight = t.name === 'light'
  const subtitle = [app.url && toNiceDomain(app.url), categoryLabel]
    .filter(Boolean)
    .join(' · ')

  return (
    <View
      style={[a.flex_grow, a.w_full, {borderRadius: 24}, a.overflow_hidden]}>
      <Image
        source={app.backgroundImage}
        contentFit="cover"
        blurRadius={BACKGROUND_BLUR_RADIUS}
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          t.atoms.bg,
          {opacity: isLight ? 0.7 : 0.8},
        ]}
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
          {profile ? <AppKnownFollowers profile={profile} link /> : undefined}
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
