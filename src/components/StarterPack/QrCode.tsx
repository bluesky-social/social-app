import React from 'react'
import {View} from 'react-native'
import QRCode from 'react-native-qrcode-styled'
import ViewShot from 'react-native-view-shot'
import {AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {isWeb} from 'platform/detection'
import {Logo} from 'view/icons/Logo'
import {Logotype} from 'view/icons/Logotype'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {Text} from '#/components/Typography'

interface Props {
  starterPack: AppBskyGraphDefs.StarterPackView
  link: string
}

export const QrCode = React.forwardRef<ViewShot, Props>(function QrCode(
  {starterPack, link},
  ref,
) {
  const {record} = starterPack

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <ViewShot ref={ref}>
      <LinearGradientBackground
        style={[
          {width: 300, minHeight: 390},
          a.align_center,
          a.px_sm,
          a.py_xl,
          a.rounded_sm,
          a.justify_between,
          a.gap_md,
        ]}>
        <View style={[a.gap_sm]}>
          <Text
            style={[a.font_bold, a.text_3xl, a.text_center, {color: 'white'}]}>
            {record.name}
          </Text>
        </View>
        <View style={[a.gap_xl, a.align_center]}>
          <Text
            style={[
              a.font_bold,
              a.text_center,
              {color: 'white', fontSize: 18},
            ]}>
            <Trans>Join the conversation</Trans>
          </Text>
          <View style={[a.rounded_sm, a.overflow_hidden]}>
            <QrCodeInner link={link} />
          </View>

          <View style={[a.flex_row, a.align_center, {gap: 5}]}>
            <Text
              style={[
                a.font_bold,
                a.text_center,
                {color: 'white', fontSize: 18},
              ]}>
              <Trans>on</Trans>
            </Text>
            <Logo width={26} fill="white" />
            <View style={[{marginTop: 5, marginLeft: 2.5}]}>
              <Logotype width={68} fill="white" />
            </View>
          </View>
        </View>
      </LinearGradientBackground>
    </ViewShot>
  )
})

export function QrCodeInner({link}: {link: string}) {
  const t = useTheme()

  return (
    <QRCode
      data={link}
      style={[
        a.rounded_sm,
        {height: 225, width: 225, backgroundColor: '#f3f3f3'},
      ]}
      pieceSize={isWeb ? 8 : 6}
      padding={20}
      // pieceLiquidRadius={2}
      pieceBorderRadius={isWeb ? 4.5 : 3.5}
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
        scale: 0.95,
        padding: 2,
        hidePieces: true,
      }}
    />
  )
}
