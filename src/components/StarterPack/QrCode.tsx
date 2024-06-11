import React from 'react'
import {View} from 'react-native'
import QRCode from 'react-native-qrcode-styled'
import ViewShot from 'react-native-view-shot'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {Logo} from 'view/icons/Logo'
import {Logotype} from 'view/icons/Logotype'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

export function QrCode({
  starterPack,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
}) {
  const t = useTheme()
  const {record} = starterPack

  const gradient =
    t.name === 'light'
      ? [t.palette.primary_500, t.palette.primary_300]
      : [t.palette.primary_600, t.palette.primary_400]

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <ViewShot>
      <LinearGradient
        colors={gradient}
        style={[
          a.flex_1,
          a.align_center,
          a.flex_row,
          a.gap_sm,
          a.py_2xl,
          a.rounded_sm,
          a.px_sm,
        ]}>
        <View style={[a.gap_5xl, a.align_center, {width: '60%'}]}>
          <Text
            style={[a.font_bold, a.text_xl, a.text_center, {color: 'white'}]}>
            <Trans>Join the conversation</Trans>
          </Text>
          <Text
            style={[a.font_bold, a.text_4xl, a.text_center, {color: 'white'}]}>
            {record.name}
          </Text>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Text
              style={[a.font_bold, a.text_xl, a.text_center, {color: 'white'}]}>
              <Trans>on</Trans>
            </Text>
            <Logo width={30} fill="white" />
            <Logotype
              width={70}
              fill="white"
              style={{marginTop: 8, marginLeft: 2}}
            />
          </View>
        </View>
        <View style={[{width: '40%'}]}>
          <QrCodeInner url="https://bsky.app" />
        </View>
      </LinearGradient>
    </ViewShot>
  )
}

export function QrCodeInner({url}: {url: string}) {
  const t = useTheme()

  return (
    <View style={[a.flex_shrink, a.rounded_md]}>
      <QRCode
        data={url}
        style={[
          a.rounded_sm,
          {height: 200, width: 200, backgroundColor: '#f3f3f3'},
        ]}
        pieceSize={8}
        padding={20}
        // pieceLiquidRadius={2}
        pieceBorderRadius={4.5}
        outerEyesOptions={{
          topLeft: {
            borderRadius: [12, 12, 0, 12],
            color: t.palette.primary_500,
          },
          topRight: {
            borderRadius: [12, 12, 12, 0],
            color: t.palette.primary_500,
          },
          bottomLeft: {
            borderRadius: [12, 0, 12, 12],
            color: t.palette.primary_500,
          },
        }}
        innerEyesOptions={{borderRadius: 3}}
        logo={{
          href: require('../../../assets/logo.png'),
          scale: 1.2,
          padding: 2,
          hidePieces: true,
        }}
      />
    </View>
  )
}
