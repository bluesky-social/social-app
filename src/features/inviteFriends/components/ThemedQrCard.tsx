import {lazy} from 'react'
import {View} from 'react-native'
// @ts-expect-error missing types
import QRCode, {useQRCodeData} from 'react-native-qrcode-styled'
import {Path} from 'react-native-svg'
import type ViewShot from 'react-native-view-shot'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'

import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {type InviteThemeVariant} from '../themes'
import {
  BUTTERFLY_PIECE_SCALE,
  butterflyPiecePath,
  eyePath,
  finderCornerAnchor,
  isInFinderRegion,
} from './qrButterflies'

const LazyViewShot = lazy(
  // @ts-expect-error dynamic import
  () => import('react-native-view-shot/src/index'),
)

const CARD_WIDTH = 278
const CARD_GRADIENT_PADDING = 12
// White panel the QR sits on.
const QR_AREA = CARD_WIDTH - CARD_GRADIENT_PADDING * 2
// White quiet-zone ring between the QR and the gradient card border, on each
// side. A bit tighter than CARD_GRADIENT_PADDING so the QR reads as the focal
// element while still keeping a clear scan margin.
const QR_MARGIN = 10
// The QR's on-screen size. Fixed regardless of module count so longer handles
// (denser matrices) don't overflow the panel - we scale pieceSize to fit, the
// way the design prototype does, rather than letting the QR grow with the data.
const QR_RENDER_SIZE = QR_AREA - QR_MARGIN * 2
// Small internal quiet zone, in QR units. Also keeps the outermost butterflies
// (which overhang their module) from clipping at the SVG edge.
const QR_QUIET = 6
// High error correction keeps the butterfly modules (which cover less of each
// cell than solid squares) and the centered avatar scannable.
const ERROR_CORRECTION_LEVEL = 'H'
const QR_DATA_OPTIONS = {errorCorrectionLevel: ERROR_CORRECTION_LEVEL} as const
// react-native-qrcode-styled ships no resolvable types; type just what we use.
const useResolvedQrCodeData = useQRCodeData as (
  data: string,
  options: typeof QR_DATA_OPTIONS,
) => {qrCodeSize: number}
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
  // Derive pieceSize from the module count so the QR always renders at
  // QR_RENDER_SIZE px (svgSize + 2*QR_QUIET == QR_RENDER_SIZE), independent of
  // handle length.
  const {qrCodeSize} = useResolvedQrCodeData(shareUrl, QR_DATA_OPTIONS)
  const pieceSize =
    qrCodeSize > 0 ? (QR_RENDER_SIZE - 2 * QR_QUIET) / qrCodeSize : 6
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
                width: QR_RENDER_SIZE,
                height: QR_RENDER_SIZE,
                backgroundColor: t.palette.white,
              }}
              pieceSize={pieceSize}
              padding={QR_QUIET}
              errorCorrectionLevel={ERROR_CORRECTION_LEVEL}
              {...qrGradient(variant.gradientFrom, variant.gradientTo)}
              renderCustomPieceItem={renderButterflyPiece}
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
                    <Logo width={40} fill={variant.qrPrimary} />
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
 * Per-module renderer for react-native-qrcode-styled. Returns a butterfly for
 * each data module, a smooth rounded ring + dot for each finder eye, and
 * nothing for the avatar area. Paths carry no fill so they inherit the canvas
 * gradient from the library's wrapping group.
 */
function renderButterflyPiece({
  x,
  y,
  pieceSize,
  qrSize,
  bitMatrix,
}: {
  x: number
  y: number
  pieceSize: number
  qrSize: number
  bitMatrix: (0 | 1)[][]
}) {
  const n = bitMatrix.length

  const corner = finderCornerAnchor(x, y, n)
  if (corner) {
    return (
      <Path
        key={`eye-${corner}`}
        d={eyePath(corner, n, pieceSize)}
        fillRule="evenodd"
      />
    )
  }
  if (isInFinderRegion(x, y, n)) return null
  if (isInLogoArea(x, y, pieceSize, qrSize)) return null
  if (bitMatrix[y]?.[x] !== 1) return null

  return (
    <Path
      key={`b-${x}-${y}`}
      d={butterflyPiecePath(
        (x + 0.5) * pieceSize,
        (y + 0.5) * pieceSize,
        pieceSize * BUTTERFLY_PIECE_SCALE,
      )}
    />
  )
}

/**
 * Clears a circular region in the QR center for the avatar overlay. The QR
 * renders at QR_RENDER_SIZE px with a viewBox of qrSize + 2*QR_QUIET == that
 * same size, so one display px equals one QR unit and the AVATAR_WRAPPER px
 * overlay maps to a radius of AVATAR_WRAPPER / 2 QR units.
 */
function isInLogoArea(
  x: number,
  y: number,
  pieceSize: number,
  qrSize: number,
): boolean {
  const clearRadius = AVATAR_WRAPPER / 2 + pieceSize * 0.5
  const cx = (x + 0.5) * pieceSize
  const cy = (y + 0.5) * pieceSize
  const center = qrSize / 2
  return Math.hypot(cx - center, cy - center) <= clearRadius
}

/**
 * Returns the `gradient` prop shape that react-native-qrcode-styled accepts.
 * Mirrors the card's top-to-bottom LinearGradient so the QR data appears as a
 * continuous extension of the card gradient rather than a separate overlay.
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
