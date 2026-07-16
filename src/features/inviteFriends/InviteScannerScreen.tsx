import {useCallback, useState} from 'react'
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {Path} from 'react-native-svg'
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {CircleInfo_Stroke2_Corner0_Rounded as InfoIcon} from '#/components/icons/CircleInfo'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const SCAN_FRAME_SIZE = 333
const SCAN_FRAME_RADIUS = 16

export function InviteScannerScreen() {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [permission, requestPermission] = useCameraPermissions()
  const [showError, setShowError] = useState(false)
  const [scannerEnabled, setScannerEnabled] = useState(true)

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!scannerEnabled) return
      const url = result.data?.trim()
      if (!url) return

      // Match blacksky.community/profile/{handle} (or legacy bsky.app) URLs
      // (with or without https://).
      const profileMatch = url.match(
        /^(?:https?:\/\/)?(?:blacksky\.community|bsky\.app)\/profile\/([^/?#]+)/i,
      )
      if (!profileMatch) {
        ax.metric('invite:scanner:scanned', {result: 'invalidQr'})
        setScannerEnabled(false)
        setShowError(true)
        return
      }

      ax.metric('invite:scanner:scanned', {result: 'profileFound'})
      setScannerEnabled(false)
      const handle = profileMatch[1]
      navigation.replace('Profile', {name: handle})
    },
    [ax, scannerEnabled, navigation],
  )

  const onRetry = useCallback(() => {
    setShowError(false)
    setScannerEnabled(true)
  }, [])

  // Permission states ---------------------------------------------------------

  if (!permission) {
    // Still loading the initial permission state — render nothing.
    return <Layout.Screen />
  }

  if (!permission.granted) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>{l`Scan QR code`}</Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <View
          style={[
            a.flex_1,
            a.align_center,
            a.justify_center,
            a.p_xl,
            a.gap_md,
          ]}>
          <InfoIcon size="xl" fill={t.atoms.text_contrast_medium.color} />
          <Text style={[a.text_xl, a.font_bold, a.text_center]}>
            {l`Camera access needed`}
          </Text>
          <Text
            style={[
              a.text_md,
              a.text_center,
              t.atoms.text_contrast_medium,
              {maxWidth: 320},
            ]}>
            {l`Blacksky needs camera access to scan QR codes from other profiles.`}
          </Text>
          <Button
            label={l`Grant access`}
            color="primary"
            size="large"
            onPress={() => void requestPermission()}
            style={{marginTop: 8}}>
            <ButtonText>{l`Grant access`}</ButtonText>
          </Button>
        </View>
      </Layout.Screen>
    )
  }

  // Active scanner ------------------------------------------------------------

  return (
    <Layout.Screen
      minimalShell
      noInsetTop
      style={{backgroundColor: t.palette.black}}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{barcodeTypes: ['qr']}}
        onBarcodeScanned={scannerEnabled ? onBarcodeScanned : undefined}
      />

      <ScannerScrim />

      {/* scan-frame outline (the colored border around the cutout) */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: SCAN_FRAME_SIZE,
          height: SCAN_FRAME_SIZE,
          marginTop: -SCAN_FRAME_SIZE / 2,
          marginLeft: -SCAN_FRAME_SIZE / 2,
          borderWidth: 2,
          borderColor: '#006aff',
          borderRadius: SCAN_FRAME_RADIUS,
        }}
        pointerEvents="none"
      />

      <View
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`Close scanner`}
          accessibilityHint={l`Dismisses the QR scanner`}
          onPress={onClose}
          hitSlop={12}
          style={({pressed}) => [
            {
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <ArrowLeftIcon size="lg" fill={t.palette.white} />
        </Pressable>
      </View>

      {/* Error overlay shown when scanned QR isn't a valid profile URL */}
      {showError && (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            transform: [{translateY: -118}],
            alignItems: 'center',
          }}
          pointerEvents="box-none">
          <View
            style={[
              a.gap_md,
              a.align_center,
              {
                width: 280,
                paddingHorizontal: 24,
                paddingVertical: 24,
                borderRadius: 16,
                backgroundColor: t.palette.white,
              },
            ]}>
            <InfoIcon size="xl" fill={t.palette.negative_500} />
            <Text style={[a.text_lg, a.font_bold, a.text_center]}>
              {l`Profile not found`}
            </Text>
            <Text
              style={[
                a.text_md,
                a.text_center,
                {color: t.palette.contrast_700},
              ]}>
              {l`Oops, this profile doesn't exist. Try scanning another one.`}
            </Text>
            <Button
              label={l`Try again`}
              color="negative"
              size="large"
              onPress={onRetry}
              style={{width: '100%', marginTop: 4}}>
              <ButtonText>{l`Try again`}</ButtonText>
            </Button>
          </View>
        </View>
      )}
    </Layout.Screen>
  )
}

/**
 * Renders a dark scrim covering the camera view with a rounded-rect cutout in
 * the middle. Implemented as a single SVG Path (outer screen rect + inner
 * rounded rect, even-odd fill) so the cutout's corners match the colored
 * outline above it.
 */
function ScannerScrim() {
  const {width, height} = useWindowDimensions()
  const r = SCAN_FRAME_RADIUS
  const half = SCAN_FRAME_SIZE / 2
  const x = width / 2 - half
  const y = height / 2 - half
  const right = x + SCAN_FRAME_SIZE
  const bottom = y + SCAN_FRAME_SIZE
  const d =
    `M0 0 H${width} V${height} H0 Z ` +
    `M${x + r} ${y} H${right - r} A${r} ${r} 0 0 1 ${right} ${y + r} ` +
    `V${bottom - r} A${r} ${r} 0 0 1 ${right - r} ${bottom} ` +
    `H${x + r} A${r} ${r} 0 0 1 ${x} ${bottom - r} ` +
    `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
      pointerEvents="none">
      <Path d={d} fill="rgba(0, 0, 0, 0.55)" fillRule="evenodd" />
    </Svg>
  )
}
