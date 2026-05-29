import {useCallback, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {CircleInfo_Stroke2_Corner0_Rounded as InfoIcon} from '#/components/icons/CircleInfo'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

const SCAN_FRAME_SIZE = 333

export function InviteScannerScreen() {
  const {t: l} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [permission, requestPermission] = useCameraPermissions()
  const [error, setError] = useState<string | null>(null)
  const [scannerEnabled, setScannerEnabled] = useState(true)

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!scannerEnabled) return
      const url = result.data?.trim()
      if (!url) return

      // Match bsky.app/profile/{handle} URLs (with or without https://).
      const profileMatch = url.match(
        /^(?:https?:\/\/)?bsky\.app\/profile\/([^/?#]+)/i,
      )
      if (!profileMatch) {
        setScannerEnabled(false)
        setError(
          l({
            message: 'Profile not found',
            comment:
              'Error shown when a scanned QR code is not a valid Bluesky profile URL',
          }),
        )
        return
      }

      setScannerEnabled(false)
      const handle = profileMatch[1]
      navigation.replace('Profile', {name: handle})
    },
    [scannerEnabled, navigation, l],
  )

  const onRetry = useCallback(() => {
    setError(null)
    setScannerEnabled(true)
  }, [])

  const onPressGallery = useCallback(() => {
    // TODO: implement gallery image picker + QR decode. expo-camera only
    // scans live; decoding from a gallery image requires an additional
    // library (e.g. @react-native-vision-camera + vision-camera-code-scanner,
    // or a JS-side decoder like jsqr running on a pixel array).
    logger.warn('InviteScanner: gallery picker not implemented yet')
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
            <Layout.Header.TitleText>{l`Scan QR Code`}</Layout.Header.TitleText>
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
            {l`Bluesky needs camera access to scan QR codes from other profiles.`}
          </Text>
          <Button
            label={l`Grant access`}
            color="primary"
            size="large"
            onPress={() => requestPermission()}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`Pick from gallery`}
          accessibilityHint={l`Choose a QR code image from your photo library`}
          onPress={onPressGallery}
          hitSlop={12}
          style={({pressed}) => [
            {
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <ImageIcon width={16} height={16} fill={t.palette.white} />
        </Pressable>
      </View>

      {/* Error overlay shown when scanned QR isn't a valid profile URL */}
      {error && (
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
 * Renders a dark scrim covering the camera view with a transparent 333x333
 * cutout in the middle. We use four absolute Views forming a window-frame
 * shape because React Native doesn't support CSS clip-path / mix-blend modes.
 */
function ScannerScrim() {
  const SCRIM_BG = 'rgba(0, 0, 0, 0.55)'
  return (
    <>
      {/* top */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: '50%',
          marginBottom: SCAN_FRAME_SIZE / 2,
          backgroundColor: SCRIM_BG,
        }}
      />
      {/* bottom */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          bottom: 0,
          marginTop: SCAN_FRAME_SIZE / 2,
          backgroundColor: SCRIM_BG,
        }}
      />
      {/* left */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '50%',
          height: SCAN_FRAME_SIZE,
          marginTop: -SCAN_FRAME_SIZE / 2,
          marginRight: SCAN_FRAME_SIZE / 2,
          backgroundColor: SCRIM_BG,
          transform: [{translateX: -SCAN_FRAME_SIZE / 2}],
        }}
      />
      {/* right */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          width: '50%',
          height: SCAN_FRAME_SIZE,
          marginTop: -SCAN_FRAME_SIZE / 2,
          marginLeft: SCAN_FRAME_SIZE / 2,
          backgroundColor: SCRIM_BG,
          transform: [{translateX: SCAN_FRAME_SIZE / 2}],
        }}
      />
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
          borderRadius: 16,
        }}
        pointerEvents="none"
      />
    </>
  )
}
