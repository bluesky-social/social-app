import {lazy} from 'react'
import {View} from 'react-native'
// @ts-expect-error missing types
import QRCode from 'react-native-qrcode-styled'
import type ViewShot from 'react-native-view-shot'
import {type AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
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
  const t = useTheme()
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
        // Follow the active accent (the named `primary` gradient is fixed pink)
        // by deriving stops from the current theme's primary ramp.
        colors={[t.palette.primary_300, t.palette.primary_600]}
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

// QR background, also used behind the center mark so it blends into the code.
const QR_BG = '#f3f3f3'

export function QrCodeInner({link}: {link: string}) {
  const t = useTheme()

  return (
    <View style={{position: 'relative'}}>
      <QRCode
        data={link}
        // Raise error correction so the QR stays scannable under the center
        // brand mark that overlays it below.
        errorCorrectionLevel="H"
        style={[
          a.rounded_sm,
          {height: 225, width: 225, backgroundColor: QR_BG},
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
      />
      {/*
       * Center brand mark. Rendered as a vector overlay (the brand wordmark)
       * rather than the QR lib's raster `logo` prop, for two reasons: it derives
       * from the single brand wordmark (no separate square logo asset to
       * maintain per brand), and a vector rasterizes reliably into the web
       * ViewShot capture - the raster `logo` does not always load before the
       * export completes. Centered on both platforms.
       */}
      <View
        style={[a.absolute, a.inset_0, a.align_center, a.justify_center]}
        pointerEvents="none">
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_sm,
            {paddingHorizontal: 8, paddingVertical: 10, backgroundColor: QR_BG},
          ]}>
          <Logo width={44} fill="#1a1a1a" />
        </View>
      </View>
    </View>
  )
}
