import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, utils} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type AtmosphereAppCardData} from '../exploreData'

export function AppCard({app}: {app: AtmosphereAppCardData}) {
  const {t: l} = useLingui()

  return (
    <View
      style={[
        a.w_full,
        a.relative,
        a.rounded_xl,
        a.overflow_hidden,
        {backgroundColor: app.overlayColor},
      ]}>
      <Image
        source={app.backgroundImage}
        contentFit="cover"
        style={[a.absolute, {top: 0, right: 0, bottom: 0, width: 96}]}
        accessible={false}
      />
      <LinearGradient
        colors={[
          utils.alpha(app.overlayColor, 1),
          utils.alpha(app.overlayColor, 0),
        ]}
        start={{x: 0, y: 0.5}}
        end={{x: 1, y: 0.5}}
        style={[a.absolute, {top: 0, right: 0, bottom: 0, width: 96}]}
        pointerEvents="none"
      />
      <Link
        to={app.href}
        label={l`Open ${app.title}`}
        accessibilityHint=""
        style={[a.w_full]}>
        <View
          style={[
            a.flex_row,
            a.w_full,
            a.align_center,
            a.gap_md,
            a.py_md,
            {paddingLeft: 24, paddingRight: 96},
          ]}>
          <Image
            source={app.logo}
            contentFit="cover"
            style={[a.rounded_md, {width: 44, height: 44}]}
            accessible={false}
          />
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text
              emoji
              style={[a.text_md, a.font_semi_bold, {color: app.textColor}]}
              numberOfLines={1}>
              {app.title}
            </Text>
            <Text
              emoji
              style={[a.text_sm, a.leading_snug, {color: app.textColor}]}
              numberOfLines={2}>
              {app.description}
            </Text>
          </View>
        </View>
      </Link>
    </View>
  )
}
