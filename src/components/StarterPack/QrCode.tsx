import {lazy, useState} from 'react'
import {View} from 'react-native'
// @ts-expect-error missing types
import QRCode from 'react-native-qrcode-styled'
import type ViewShot from 'react-native-view-shot'
import {type AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import * as bsky from '#/types/bsky'

const LazyViewShot = lazy(
  // @ts-expect-error dynamic import
  () => import('react-native-view-shot/src/index'),
)

export function QrCode({
  starterPack,
  link,
  ref,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  link: string
  ref: React.Ref<ViewShot>
}) {
  const {record} = starterPack

  if (
    !bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
      record,
      AppBskyGraphStarterpack.isRecord,
    )
  ) {
    return null
  }

  return (
    <LazyViewShot ref={ref}>
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
            style={[
              a.font_semi_bold,
              a.text_3xl,
              a.text_center,
              {color: 'white'},
            ]}>
            {record.name}
          </Text>
        </View>
        <View style={[a.gap_xl, a.align_center]}>
          <Text
            style={[
              a.font_semi_bold,
              a.text_center,
              {color: 'white', fontSize: 18},
            ]}>
            <Trans>Join the conversation</Trans>
          </Text>
          <View style={[a.rounded_sm, a.overflow_hidden]}>
            <QrCodeInner link={link} />
          </View>

          <Text
            style={[
              a.flex,
              a.flex_row,
              a.align_center,
              a.font_semi_bold,
              {color: 'white', fontSize: 18, gap: 6},
            ]}>
            <Trans>
              on
              <View style={[a.flex_row, a.align_center, {gap: 6}]}>
                <Logo width={25} fill="white" />
                <View style={[{marginTop: 3.5}]}>
                  <Logotype width={72} fill="white" />
                </View>
              </View>
            </Trans>
          </Text>
        </View>
      </LinearGradientBackground>
    </LazyViewShot>
  )
}

export function QrCodeInner({link}: {link: string}) {
  const t = useTheme()
  const [logoArea, setLogoArea] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const onLogoAreaChange = (area: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    setLogoArea(area)
  }

  return (
    <View style={{position: 'relative'}}>
      {/* An SVG version of the logo is placed on top of normal `QRCode` `logo` prop, since the PNG fails to load before the export completes on web. */}
      {IS_WEB && logoArea && (
        <View
          style={{
            position: 'absolute',
            left: logoArea.x,
            top: logoArea.y + 1,
            zIndex: 1,
            padding: 4,
          }}>
          <Logo width={logoArea.width - 14} height={logoArea.height - 14} />
        </View>
      )}
      <QRCode
        data={link}
        style={[
          a.rounded_sm,
          {height: 225, width: 225, backgroundColor: '#f3f3f3'},
        ]}
        pieceSize={IS_WEB ? 8 : 6}
        padding={20}
        pieceBorderRadius={IS_WEB ? 4.5 : 3.5}
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
          ...(IS_WEB && {
            onChange: onLogoAreaChange,
            padding: 28,
          }),
          ...(!IS_WEB && {
            padding: 2,
            scale: 0.95,
          }),
          hidePieces: true,
        }}
      />
    </View>
  )
}
