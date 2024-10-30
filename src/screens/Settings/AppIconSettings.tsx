import React from 'react'
import {Text, View} from 'react-native'
import AppIcon from 'react-native-dynamic-app-icon'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'

const icons = [
  'default',
  'bonfire',
  'midnight',
  'nordic-light',
  'summer',
  'sunset',
  'classic',
] as const

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppIconSettings'>
export function AppIconSettingsScreen({}: Props) {
  const {_} = useLingui()
  return (
    <Layout.Screen>
      <Layout.Header title={_('App Icon')} />
      <Layout.Content
        contentContainerStyle={[a.flex_row, a.flex_wrap, a.py_2xl, a.px_xl]}>
        {icons.map(icon => (
          <View
            style={[{width: '50%'}, a.py_lg, a.px_xs, a.align_center]}
            key={icon}>
            <PressableScale
              accessibilityLabel={_(msg`${icon} app icon`)}
              accessibilityHint={_(msg`Tap to change app icon`)}
              targetScale={0.95}
              onPress={() =>
                AppIcon.setAppIcon(icon === 'default' ? null : icon)
              }>
              <Image
                source={getImage(icon)}
                style={[
                  {width: 100, height: 100, borderRadius: 20},
                  a.curve_continuous,
                ]}
                accessibilityIgnoresInvertColors
              />
            </PressableScale>
            <IconName icon={icon} />
          </View>
        ))}
      </Layout.Content>
    </Layout.Screen>
  )
}

function getImage(icon: (typeof icons)[number]) {
  switch (icon) {
    case 'default':
      return require(`../../../assets/icon.png`)
    case 'bonfire':
      return require(`../../../assets/icon-bonfire.png`)
    case 'midnight':
      return require(`../../../assets/icon-midnight.png`)
    case 'nordic-light':
      return require(`../../../assets/icon-nordic-light.png`)
    case 'summer':
      return require(`../../../assets/icon-summer.png`)
    case 'sunset':
      return require(`../../../assets/icon-sunset.png`)
    case 'classic':
      return require(`../../../assets/icon-classic.png`)
  }
}

function IconName({icon}: {icon: (typeof icons)[number]}) {
  const {_} = useLingui()

  let name
  switch (icon) {
    case 'default':
      name = _(msg`Bluesky`)
      break
    case 'bonfire':
      name = _(msg`Bonfire`)
      break
    case 'midnight':
      name = _(msg`Midnight`)
      break
    case 'nordic-light':
      name = _(msg`Nordic Light`)
      break
    case 'summer':
      name = _(msg`Summer`)
      break
    case 'sunset':
      name = _(msg`Sunset`)
      break
    case 'classic':
      name = _(msg`clouds.jpg`)
      break
  }

  return (
    <Text style={[a.text_center, a.font_bold, a.text_md, a.mt_md]}>{name}</Text>
  )
}
