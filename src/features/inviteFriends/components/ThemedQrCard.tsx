import {lazy} from 'react'
import {View} from 'react-native'
// @ts-expect-error missing types
import QRCode from 'react-native-qrcode-styled'
import type ViewShot from 'react-native-view-shot'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'

import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {hexToRgb, rgbToHex} from '#/alf/util/colorGeneration'
import {Text} from '#/components/Typography'
import {type InviteThemeVariant} from '../themes'

const LazyViewShot = lazy(
  // @ts-expect-error dynamic import
  () => import('react-native-view-shot/src/index'),
)

const CARD_WIDTH = 278
const CARD_GRADIENT_PADDING = 12
const QR_AREA = CARD_WIDTH - CARD_GRADIENT_PADDING * 2
const QR_PIECE_SIZE = 7
const QR_INNER_PADDING = 4
const AVATAR_WRAPPER = 72
const AVATAR_IMAGE = 60
const AVATAR_BORDER = 2

export function ThemedQrCard({
  variant,
  shareUrl,
  handle,
  avatarUri,
  captureRef,
}: {
  variant: InviteThemeVariant
  shareUrl: string
  handle: string
  avatarUri?: string
  captureRef: React.Ref<ViewShot>
}) {
  const t = useTheme()
  return (
    <LazyViewShot ref={captureRef}>
      <View
        style={{
          width: CARD_WIDTH,
          borderRadius: 20,
          backgroundColor: variant.gradientFrom,
          shadowColor: variant.shadowColor,
          shadowOpacity: 0.5,
          shadowRadius: 25,
          shadowOffset: {width: 4, height: 4},
        }}>
        <LinearGradient
          colors={[variant.gradientFrom, variant.gradientTo]}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
          style={[
            a.align_center,
            {
              padding: CARD_GRADIENT_PADDING,
              borderRadius: 20,
              overflow: 'hidden',
            },
          ]}>
          <View
            style={[
              a.align_center,
              a.justify_center,
              {
                width: QR_AREA,
                height: QR_AREA,
                backgroundColor: t.palette.white,
                borderRadius: 10,
                overflow: 'hidden',
              },
            ]}>
            <QRCode
              data={shareUrl}
              style={{
                width: QR_AREA,
                height: QR_AREA,
                backgroundColor: t.palette.white,
              }}
              pieceSize={QR_PIECE_SIZE}
              padding={QR_INNER_PADDING}
              pieceBorderRadius={3.5}
              {...qrGradient(variant.gradientFrom, variant.gradientTo)}
              outerEyesOptions={{
                topLeft: {
                  borderRadius: 16,
                  color: eyeColor(
                    variant.gradientFrom,
                    variant.gradientTo,
                    EYE_TOP_T,
                  ),
                },
                topRight: {
                  borderRadius: 16,
                  color: eyeColor(
                    variant.gradientFrom,
                    variant.gradientTo,
                    EYE_TOP_T,
                  ),
                },
                bottomLeft: {
                  borderRadius: 16,
                  color: eyeColor(
                    variant.gradientFrom,
                    variant.gradientTo,
                    EYE_BOTTOM_T,
                  ),
                },
              }}
              innerEyesOptions={{
                topLeft: {
                  color: eyeColor(
                    variant.gradientFrom,
                    variant.gradientTo,
                    EYE_TOP_T,
                  ),
                },
                topRight: {
                  color: eyeColor(
                    variant.gradientFrom,
                    variant.gradientTo,
                    EYE_TOP_T,
                  ),
                },
                bottomLeft: {
                  color: eyeColor(
                    variant.gradientFrom,
                    variant.gradientTo,
                    EYE_BOTTOM_T,
                  ),
                },
              }}
              logo={{
                hidePieces: true,
                padding: 2,
                scale: 0.95,
                href: avatarUri
                  ? {uri: avatarUri}
                  : require('../../../../assets/logo.png'),
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: AVATAR_WRAPPER,
                height: AVATAR_WRAPPER,
                borderRadius: AVATAR_WRAPPER / 2,
                backgroundColor: t.palette.white,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: AVATAR_IMAGE,
                  height: AVATAR_IMAGE,
                  borderRadius: AVATAR_IMAGE / 2,
                  borderWidth: AVATAR_BORDER,
                  borderColor: t.palette.white,
                  overflow: 'hidden',
                }}>
                {avatarUri ? (
                  <Image
                    source={{uri: avatarUri}}
                    style={{
                      width: AVATAR_IMAGE - AVATAR_BORDER * 2,
                      height: AVATAR_IMAGE - AVATAR_BORDER * 2,
                      borderRadius: (AVATAR_IMAGE - AVATAR_BORDER * 2) / 2,
                    }}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={[a.flex_1, a.align_center, a.justify_center]}>
                    <Logo
                      allowVariants={false}
                      width={40}
                      fill={variant.qrPrimary}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
          <Text
            style={[
              a.font_medium,
              a.text_md,
              {color: variant.handleColor, paddingTop: 12, paddingBottom: 2},
            ]}
            numberOfLines={1}
            ellipsizeMode="middle">
            {`@${handle}`}
          </Text>
        </LinearGradient>
      </View>
    </LazyViewShot>
  )
}

/**
 * Returns the `gradient` prop shape that react-native-qrcode-styled accepts
 * on both pieces and eyes. Mirrors the card's top-to-bottom LinearGradient
 * so the QR data appears as a continuous extension of the card gradient
 * rather than a separate solid-color overlay.
 */
function qrGradient(from: string, to: string) {
  return {
    gradient: {
      type: 'linear' as const,
      options: {
        colors: [from, to],
        start: [0.5, 0] as [number, number],
        end: [0.5, 1] as [number, number],
      },
    },
  }
}

// Vertical positions (0..1 along the QR) where the corner eye centers sit.
// QR is 33 modules square; eye centers are at module index 3 and 29.
const EYE_TOP_T = 3 / 33
const EYE_BOTTOM_T = 29 / 33

/**
 * Returns the solid color the canvas-wide gradient would paint at vertical
 * position `t` (0=top, 1=bottom). We use this to color each eye so that the
 * eye blends seamlessly into the gradient on the surrounding data pieces.
 * Eyes can't use a local `gradient` prop here - react-native-qrcode-styled
 * 0.3.3 has an internal ID mismatch where the eye gradient <defs> are
 * registered as `${pos}CornerSquareGradient` / `${pos}CornerDotGradient`
 * but the Path fill references `url(#${pos}OuterEyeGradient)` /
 * `url(#${pos}InnerEyeGradient)`, so per-eye gradients silently render
 * with no fill.
 */
function eyeColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from)
  const toRgb = hexToRgb(to)
  if (!fromRgb || !toRgb) return from
  return rgbToHex(
    fromRgb.r + (toRgb.r - fromRgb.r) * t,
    fromRgb.g + (toRgb.g - fromRgb.g) * t,
    fromRgb.b + (toRgb.b - fromRgb.b) * t,
  )
}
