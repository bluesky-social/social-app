import {View} from 'react-native'
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Discord} from '#/components/icons/community/Discord'
import {Facebook} from '#/components/icons/community/Facebook'
import {Line} from '#/components/icons/community/Line'
import {Messenger} from '#/components/icons/community/Messenger'
import {Reddit} from '#/components/icons/community/Reddit'
import {Signal} from '#/components/icons/community/Signal'
import {Telegram} from '#/components/icons/community/Telegram'
import {Threads} from '#/components/icons/community/Threads'
import {WhatsApp} from '#/components/icons/community/WhatsApp'
import {X} from '#/components/icons/community/X'
import {IS_IOS} from '#/env'
import {getSharePlatform, type SharePlatformId} from './catalog'
import {GmailColor, MailEnvelope, MessagesBubble, SnapchatGhost} from './icons'

type Appearance = {
  /**
   * The logo, drawn in white. The full-color logos in `./icons` (Gmail, Mail,
   * Snapchat) draw their own colors.
   */
  icon: React.ComponentType<SVGIconProps>
  /** Brand color, used to fill the circle behind the logo. */
  color: string
  /**
   * Top and bottom colors of a vertical gradient drawn over `color`, for
   * brands whose icon fades (Mail).
   */
  gradient?: [top: string, bottom: string]
  /** Adds a hairline so a black or white tile doesn't blend into the sheet. */
  outline?: boolean
  /** Logo width as a fraction of `LOGO_REFERENCE_SIZE`. See below. */
  scale: number
  /**
   * The logo's optical center in its 24x24 viewBox, moved to the middle of
   * the circle. See below.
   */
  center: [x: number, y: number]
}

/*
 * Logos differ a lot in how much of their 24x24 box they fill, and in how
 * heavy they are: a solid bubble (Messenger) reads bigger than an outline
 * (WhatsApp) with the same bounds. Measured from each logo as the app draws
 * it:
 *
 * - scale: sized so every logo has the same visual weight, taken as the
 *   geometric mean of its bounding box area and its ink area. That shrinks
 *   solid shapes and grows outlines. The longest side is capped at 72% of the
 *   circle so tall or wide shapes don't crowd the edge. The overall size
 *   (about half the circle) is a design call; scale every value to change it.
 * - center: 75% bounding box center, 25% ink centroid, so lopsided shapes
 *   (the WhatsApp and Messenger bubble tails) look centered.
 *
 * Re-measure if a logo changes. Discord and Signal are drawn about 15% under
 * their measured size, Facebook about 25% under and X about 40% under, since
 * at the measured size they read as too big.
 */
const APPEARANCE: Record<SharePlatformId, Appearance> = {
  messages: {
    icon: MessagesBubble,
    color: '#34C759',
    scale: 0.537,
    center: [11.83, 12.17],
  },
  whatsapp: {
    icon: WhatsApp,
    color: '#25D366',
    scale: 0.556,
    center: [11.85, 12.18],
  },
  discord: {
    icon: Discord,
    color: '#5865F2',
    scale: 0.564,
    center: [12, 12],
  },
  telegram: {
    icon: Telegram,
    color: '#26A5E4',
    scale: 0.96,
    center: [11.63, 12.45],
  },
  signal: {
    icon: Signal,
    color: '#3A76F0',
    scale: 0.502,
    center: [11.9, 12.18],
  },
  email: {
    icon: MailEnvelope,
    color: '#1E6CF0',
    gradient: ['#21C4FF', '#1E6CF0'],
    scale: 0.613,
    center: [11.92, 12.01],
  },
  gmail: {
    icon: GmailColor,
    color: '#FFFFFF',
    outline: true,
    scale: 0.543,
    center: [12.06, 12],
  },
  facebook: {
    icon: Facebook,
    color: '#0866FF',
    scale: 0.7,
    center: [12, 14.04],
  },
  messenger: {
    icon: Messenger,
    color: '#0866FF',
    scale: 0.467,
    center: [11.97, 11.93],
  },
  line: {
    icon: Line,
    color: '#06C755',
    scale: 0.494,
    center: [11.91, 11.6],
  },
  snapchat: {
    icon: SnapchatGhost,
    color: '#FFFC00',
    scale: 0.494,
    center: [11.99, 12.09],
  },
  reddit: {
    icon: Reddit,
    color: '#FF4500',
    scale: 0.67,
    center: [12.08, 11.86],
  },
  x: {
    icon: X,
    color: '#000000',
    outline: true,
    scale: 0.44,
    center: [11.96, 12.1],
  },
  threads: {
    icon: Threads,
    color: '#000000',
    outline: true,
    scale: 0.525,
    center: [11.97, 12.03],
  },
}

/**
 * The circle size the `scale` values were measured against. Logos stay this
 * size when the circle changes, so a smaller circle just has less padding.
 */
const LOGO_REFERENCE_SIZE = 60

/**
 * The platform's name as shown under its tile. Brand names aren't
 * translated, but the generic ones are.
 */
export function useSharePlatformLabel(id: SharePlatformId): string {
  const {t: l} = useLingui()
  switch (id) {
    case 'messages':
      /*
       * On Android this opens whichever texting app the phone uses (Google
       * Messages, Samsung Messages...), so it's named for what it sends.
       */
      return IS_IOS
        ? l({
            message: 'Messages',
            comment: 'Share target that opens the iPhone’s Messages app',
          })
        : l({
            message: 'SMS',
            comment:
              'Share target on Android that opens the phone’s text messaging app',
          })
    case 'email':
      return l({
        message: 'Email',
        comment: 'Share target that opens the email app',
      })
    default:
      return getSharePlatform(id).label
  }
}

/**
 * The round, brand-colored tile for a platform, with its logo.
 */
export function SharePlatformIcon({
  id,
  size,
  pressed = false,
}: {
  id: SharePlatformId
  size: number
  pressed?: boolean
}) {
  const t = useTheme()
  const {icon: Icon, color, gradient, outline, scale, center} = APPEARANCE[id]
  const iconSize = LOGO_REFERENCE_SIZE * scale
  const [cx, cy] = center

  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_full,
        outline && [a.border, t.atoms.border_contrast_medium],
        {
          width: size,
          height: size,
          backgroundColor: color,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {gradient && (
        <Svg width={size} height={size} style={[a.absolute, a.inset_0]}>
          <Defs>
            <LinearGradient
              id={`share-platform-${id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1">
              <Stop offset={0} stopColor={gradient[0]} />
              <Stop offset={1} stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2}
            fill={`url(#share-platform-${id})`}
          />
        </Svg>
      )}
      <Icon
        width={iconSize}
        fill="#FFFFFF"
        style={{
          transform: [
            {translateX: ((12 - cx) * iconSize) / 24},
            {translateY: ((12 - cy) * iconSize) / 24},
          ],
        }}
      />
    </View>
  )
}
