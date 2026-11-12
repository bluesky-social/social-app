import Svg, {Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg'

import {type Props as SVGIconProps} from '#/components/icons/common'
import {Snapchat} from '#/components/icons/community/Snapchat'
import {createSinglePathSVG} from '#/components/icons/TEMPLATE'

/**
 * A plain speech bubble, like Apple's Messages icon. It's our Message icon's
 * bubble without the three dots.
 */
export const MessagesBubble = createSinglePathSVG({
  path: 'M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a10 10 0 0 1-4.136-.893l-4.68.876a1 1 0 0 1-1.164-1.184l.931-4.537A10 10 0 0 1 2 12Z',
})

/*
 * Logos that aren't a single flat color, so they can't come from the icon
 * generator. They ignore `fill` and draw a square of `width`.
 */

const SNAPCHAT_PATH = Snapchat.svgPaths[0]

/**
 * Snapchat's ghost as people know it: white with a black outline.
 */
export function SnapchatGhost({width, style}: SVGIconProps) {
  return (
    // Padded so the outline isn't clipped where the ghost touches the edge
    <Svg
      viewBox="-0.75 -0.75 25.5 25.5"
      width={width}
      height={width}
      style={style}>
      {/* The fill on top hides the inner half of the stroke */}
      <Path
        d={SNAPCHAT_PATH}
        fill="#000000"
        stroke="#000000"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d={SNAPCHAT_PATH} fill="#FFFFFF" />
    </Svg>
  )
}

/**
 * Gmail's gradient "M" from its 2026 redesign, centered in a square.
 */
export function GmailColor({width, style}: SVGIconProps) {
  return (
    <Svg viewBox="0 -81.82 800 800" width={width} height={width} style={style}>
      <Defs>
        <LinearGradient
          id="gmail-right"
          x1="713.64"
          y1="81.82"
          x2="713.64"
          y2="636.36"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#60D673" />
          <Stop offset="0.17" stopColor="#42C868" />
          <Stop offset="0.39" stopColor="#0EBC5F" />
          <Stop offset="0.62" stopColor="#00A9BB" />
          <Stop offset="0.86" stopColor="#3C90FF" />
          <Stop offset="1" stopColor="#3186FF" />
        </LinearGradient>
        <LinearGradient
          id="gmail-top"
          x1="0"
          y1="91.5"
          x2="800"
          y2="91.5"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0.08" stopColor="#FF63A0" />
          <Stop offset="0.3" stopColor="#FC413D" />
          <Stop offset="0.65" stopColor="#FC413D" />
          <Stop offset="0.72" stopColor="#FC5C30" />
          <Stop offset="0.86" stopColor="#FEB10C" />
          <Stop offset="0.91" stopColor="#FEC700" />
          <Stop offset="0.96" stopColor="#FFDB0F" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#gmail-right)"
        d="M627.27 81.82H800V581.82c0 30.12-24.42 54.55-54.55 54.55h-90.91a27.27 27.27 0 0 1-27.27-27.27z"
      />
      <Path
        fill="#FC413D"
        d="M172.73 81.82H0V581.82c0 30.12 24.42 54.55 54.55 54.55h90.91a27.27 27.27 0 0 0 27.27-27.27z"
      />
      <Path
        fill="url(#gmail-top)"
        d="M141.94 20.26C105.42-10.44 50.95-5.72 20.26 30.8-10.44 67.31-5.72 121.78 30.8 152.48l345.81 290.68a36.36 36.36 0 0 0 46.8 0L769.21 152.47c36.51-30.69 41.23-85.16 10.54-121.68C749.05-5.72 694.58-10.44 658.07 20.26L400 237.18z"
      />
    </Svg>
  )
}

/**
 * A white envelope with its folds showing through in blue, like Apple's Mail
 * icon.
 */
export function MailEnvelope({width, style}: SVGIconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={width} style={style}>
      <Rect x={2} y={5} width={20} height={14} rx={1.6} fill="#FFFFFF" />
      <Path
        d="M2.6 5.6 12 13l9.4-7.4M2.6 18.4l7.1-6.3M21.4 18.4l-7.1-6.3"
        fill="none"
        stroke="#2D8CF7"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
