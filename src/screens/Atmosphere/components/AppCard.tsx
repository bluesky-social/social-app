import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {type AtmosphereAppCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {toNiceDomain} from '#/lib/strings/url-helpers'

export function AppCard({app}: {app: AtmosphereAppCardData}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.relative,
        a.rounded_xl,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      {app.backgroundImage ? (
        <Image
          source={app.backgroundImage}
          contentFit="cover"
          style={[a.absolute, {top: 0, right: 0, bottom: 0, width: 96}]}
          accessible={false}
        />
      ) : undefined}
      <Link
        to={app.href}
        label={l`Open ${app.title}`}
        accessibilityHint=""
        style={[a.w_full]}>
        <View
          style={[a.flex_row, a.w_full, a.gap_md, a.p_md, {paddingRight: 96}]}>
          {app.logo ? (
            <Image
              source={app.logo}
              contentFit="cover"
              style={[a.rounded_md, {width: 44, height: 44}]}
              accessible={false}
            />
          ) : undefined}
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text>
              <Text emoji style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
                {app.title}
              </Text>{' '}
              <Text emoji style={[a.text_sm, t.atoms.text_contrast_medium]} numberOfLines={1}>
                • {toNiceDomain(app.href)}
              </Text>
            </Text>
            {app.description ? (
              <Text emoji style={[a.text_sm, a.leading_snug]} numberOfLines={2}>
                {app.description}
              </Text>
            ) : undefined}
          </View>
        </View>
      </Link>
    </View>
  )
}
