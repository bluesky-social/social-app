import {StyleProp, TextStyle, ViewStyle} from 'react-native'
import Svg, {Circle, Ellipse, Line, Path, Rect} from 'react-native-svg'

import React from 'react'

export function SolarplexLogo({style}: {style?: StyleProp<ViewStyle>}) {
  return (
    <Svg style={style} width="150" height="32" viewBox="0 0 105 22" fill="none">
      <Ellipse cx="8.71799" cy="11" rx="8.71799" ry="8.71851" fill="#2E008B" />
      <Path
        d="M6.22717 19.3574C4.8504 18.9477 3.61616 18.2069 2.6167 17.2275H6.22717V19.3574Z"
        fill="#7173B9"
      />
      <Path
        d="M6.22714 17.2275H11.2057C11.8938 17.2275 12.4512 16.6702 12.4512 15.982C12.4512 15.2939 11.8938 14.7365 11.2057 14.7365H7.47257C6.78447 14.7365 6.22714 15.2939 6.22714 15.982V17.2275Z"
        fill="#397BAD"
      />
      <Path
        d="M0.838959 14.7365C0.471134 13.9621 0.214083 13.125 0.0882874 12.2455H6.22714V13.491C6.22714 14.1791 5.66981 14.7365 4.98171 14.7365H0.838959Z"
        fill="#FEA39A"
      />
      <Path
        d="M7.47257 9.75452H13.6997C14.3878 9.75452 14.9451 10.3119 14.9451 11C14.9451 11.6882 14.3878 12.2455 13.6997 12.2455H6.22714V11C6.22714 10.3119 6.78447 9.75452 7.47257 9.75452Z"
        fill="#FB7616"
      />
      <Path
        d="M0.0882874 9.75443C0.214083 8.87493 0.471134 8.03776 0.838959 7.26343H6.22714V8.50893C6.22714 9.19707 5.66981 9.75443 4.98171 9.75443H0.0882874Z"
        fill="#F8D55D"
      />
      <Path
        d="M6.22714 7.26347H11.2057C11.8938 7.26347 12.4512 6.7061 12.4512 6.01796C12.4512 5.32982 11.8938 4.77246 11.2057 4.77246H7.47257C6.78447 4.77246 6.22714 5.32982 6.22714 6.01796V7.26347Z"
        fill="#FFB549"
      />
      <Path
        d="M24.3639 16.7638C22.7365 16.7638 22.0583 16.1825 22.0583 15.3494V15.1557C22.0583 14.6907 21.6321 14.4775 21.2252 14.4775C20.5471 14.4775 20.2371 14.8844 20.2371 15.33C20.2371 16.6088 21.3802 17.8294 24.4608 17.8294C27.2895 17.8294 28.6458 16.5313 28.6458 14.8263C28.6458 13.3732 27.832 12.4432 25.6427 11.9588L23.9958 11.5907C22.9496 11.3582 22.4846 10.9126 22.4846 10.2539C22.4846 9.36262 23.2208 8.74263 24.5771 8.74263C25.9914 8.74263 26.6114 9.24637 26.6114 9.94386V10.1376C26.6114 10.5638 26.9795 10.7963 27.4058 10.7963C28.0839 10.7963 28.3939 10.4089 28.3939 9.92448C28.3939 8.89762 27.5026 7.67702 24.4414 7.67702C21.9227 7.67702 20.6052 8.85887 20.6052 10.5445C20.6052 11.9007 21.419 12.8307 23.2983 13.2569L25.0614 13.6638C26.2433 13.9544 26.747 14.3225 26.747 15.0975C26.747 16.1244 25.817 16.7638 24.3639 16.7638ZM35.189 7.67702C32.244 7.67702 30.3259 9.75011 30.3259 12.7532C30.3259 15.7175 32.244 17.7906 35.189 17.7906C38.1145 17.7906 40.0326 15.7175 40.0326 12.7338C40.0326 9.75011 38.1145 7.67702 35.189 7.67702ZM35.189 16.5506C33.5615 16.5506 32.5346 15.5625 32.5346 14.1675V11.3582C32.5346 9.94386 33.5615 8.917 35.189 8.917C36.7777 8.917 37.8239 9.94386 37.8239 11.3582V14.1675C37.8239 15.5625 36.7777 16.5506 35.189 16.5506ZM44.2916 3.74395H40.5329V5.02268H42.2766V17.5H44.2916V3.74395ZM53.0882 16.2406C53.2432 16.8219 53.495 17.2869 53.8825 17.655L56.5562 17.2675V16.1438L55.665 16.2213C55.1419 16.2794 54.8513 15.9306 54.8513 14.9232V11.3001C54.8513 8.89762 53.5144 7.67702 50.6276 7.67702C48.2057 7.67702 46.9076 8.78137 46.9076 10.1376C46.9076 10.777 47.237 11.1257 47.8376 11.1257C48.4576 11.1257 48.787 10.8351 48.787 10.312V10.0795C48.787 9.30449 49.4457 8.82012 50.5888 8.82012C52.1776 8.82012 52.8169 9.53699 52.8169 10.9513V12.5594C51.9257 12.2301 51.0345 12.017 49.9882 12.017C47.702 12.017 46.3845 13.0438 46.3845 14.8844C46.3845 16.6281 47.6245 17.7712 49.8138 17.7712C51.3251 17.7712 52.3519 17.1513 52.9719 16.2406H53.0882ZM48.477 15.2138V14.3613C48.477 13.4701 49.1357 12.9469 50.4145 12.9469C51.2669 12.9469 52.0613 13.1407 52.8169 13.4701V14.3419C52.8169 15.8144 51.7319 16.5894 50.337 16.5894C49.097 16.5894 48.477 16.0275 48.477 15.2138ZM57.9497 17.5H59.9647V11.9007C59.9647 10.1957 60.9334 9.13012 62.0959 9.13012C62.6965 9.13012 62.9871 9.36262 62.9871 9.90511V10.467C62.9871 10.9707 63.2971 11.2807 63.8203 11.2807C64.5371 11.2807 64.9827 10.7576 64.9827 9.82761C64.9827 8.58763 64.3627 7.71577 62.8903 7.71577C61.5728 7.71577 60.5653 8.5295 60.0616 9.61449H59.9647V7.96764H56.206V9.26574H57.9497V17.5ZM76.7284 12.8307C76.7284 9.42074 75.0621 7.77389 72.6597 7.77389C71.1872 7.77389 70.2185 8.49075 69.5597 9.47886H69.4628V7.96764H65.7041V9.26574H67.4479V21.4331H69.4628L69.4822 15.95H69.5791C70.141 16.9963 71.0903 17.7131 72.6597 17.7131C75.0428 17.7131 76.7284 16.1438 76.7284 12.8307ZM69.4628 13.5476V10.6413C70.1797 9.69199 70.9353 9.16887 72.0203 9.16887C73.5509 9.16887 74.5003 10.157 74.5003 11.707V13.7607C74.5003 15.3688 73.5703 16.3181 72.0009 16.3181C70.3153 16.3181 69.4628 15.0782 69.4628 13.5476ZM80.9976 3.74395H77.2389V5.02268H78.9826V17.5H80.9976V3.74395ZM92.216 15.5625L91.1504 14.9425C90.4723 16.0275 89.5617 16.5894 88.2248 16.5894C86.7136 16.5894 85.5124 15.7175 85.5124 14.1094V13.2182H92.5841C93.0491 9.76949 91.1117 7.67702 88.128 7.67702C85.183 7.67702 83.3037 9.71136 83.3037 12.7726C83.3037 15.8531 85.2218 17.81 88.1086 17.81C89.9492 17.81 91.3248 17.0544 92.216 15.5625ZM88.1667 8.93637C89.8136 8.93637 90.7435 9.88573 90.7435 11.2807C90.7435 11.9201 90.5111 12.1913 90.0654 12.1913H85.5124V11.3776C85.5124 9.86636 86.578 8.93637 88.1667 8.93637ZM93.4477 7.96764V9.26574H94.5133L97.1289 12.5982L94.3195 16.2019H93.4477V17.5H97.0901V16.2019H95.7533L97.9814 13.3151H98.0782L100.364 16.2019H99.0082V17.5H103.813V16.2019H102.748L100.016 12.7726L102.748 9.26574H103.619V7.96764H99.9963V9.26574H101.333L99.1826 12.0557H99.0664L96.9545 9.26574H98.3107V7.96764H93.4477Z"
        fill="#2E008B"
      />
    </Svg>
  )
}

export function GridIcon({
  style,
  solid,
}: {
  style?: StyleProp<ViewStyle>
  solid?: boolean
}) {
  const DIM = 4
  const ARC = 2
  return (
    <Svg width="24" height="24" style={style}>
      <Path
        d={`M4,1 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
      <Path
        d={`M16,1 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
      <Path
        d={`M4,13 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
      <Path
        d={`M16,13 h${DIM} a${ARC},${ARC} 0 0 1 ${ARC},${ARC} v${DIM} a${ARC},${ARC} 0 0 1 -${ARC},${ARC} h-${DIM} a${ARC},${ARC} 0 0 1 -${ARC},-${ARC} v-${DIM} a${ARC},${ARC} 0 0 1 ${ARC},-${ARC} z`}
        strokeWidth={2}
        stroke="#000"
        fill={solid ? '#000' : undefined}
      />
    </Svg>
  )
}
export function GridIconSolid({style}: {style?: StyleProp<ViewStyle>}) {
  return <GridIcon style={style} solid />
}

export function HomeIcon({
  style,
  size,
  strokeWidth = 4,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 48 48"
      width={size || 24}
      height={size || 24}
      stroke="currentColor"
      fill="none"
      style={style}>
      <Path
        strokeWidth={strokeWidth}
        d="M 23.951 2 C 23.631 2.011 23.323 2.124 23.072 2.322 L 8.859 13.52 C 7.055 14.941 6 17.114 6 19.41 L 6 38.5 C 6 39.864 7.136 41 8.5 41 L 18.5 41 C 19.864 41 21 39.864 21 38.5 L 21 28.5 C 21 28.205 21.205 28 21.5 28 L 26.5 28 C 26.795 28 27 28.205 27 28.5 L 27 38.5 C 27 39.864 28.136 41 29.5 41 L 39.5 41 C 40.864 41 42 39.864 42 38.5 L 42 19.41 C 42 17.114 40.945 14.941 39.141 13.52 L 24.928 2.322 C 24.65 2.103 24.304 1.989 23.951 2 Z"
      />
    </Svg>
  )
}

export function HomeIconSolid({
  style,
  size,
  strokeWidth = 4,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 48 48"
      width={size || 24}
      height={size || 24}
      stroke="currentColor"
      style={style}>
      <Path
        fill="currentColor"
        strokeWidth={strokeWidth}
        d="m 23.951,2 c -0.32,0.011 -0.628,0.124 -0.879,0.322 L 8.859,13.52 C 7.055,14.941 6,17.114 6,19.41 V 38.5 C 6,39.864 7.136,41 8.5,41 h 8 c 1.364,0 2.5,-1.136 2.5,-2.5 v -12 C 19,26.205 19.205,26 19.5,26 h 9 c 0.295,0 0.5,0.205 0.5,0.5 v 12 c 0,1.364 1.136,2.5 2.5,2.5 h 8 C 40.864,41 42,39.864 42,38.5 V 19.41 c 0,-2.296 -1.055,-4.469 -2.859,-5.89 L 24.928,2.322 C 24.65,2.103 24.304,1.989 23.951,2 Z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MagnifyingGlassIcon({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </Svg>
  )
}

export function MagnifyingGlassIcon2({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Ellipse cx="12" cy="11" rx="9" ry="9" />
      <Line x1="19" y1="17.3" x2="23.5" y2="21" strokeLinecap="round" />
    </Svg>
  )
}

export function MagnifyingGlassIcon2Solid({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Ellipse
        cx="12"
        cy="11"
        rx="7"
        ry="7"
        stroke="none"
        fill="currentColor"
      />
      <Ellipse cx="12" cy="11" rx="9" ry="9" />
      <Line x1="19" y1="17.3" x2="23.5" y2="21" strokeLinecap="round" />
    </Svg>
  )
}

// https://github.com/Remix-Design/RemixIcon/blob/master/License
export function BellIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 24}
      height={size || 24}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path d="M 11.642 2 H 12.442 A 8.6 8.55 0 0 1 21.042 10.55 V 18.1 A 1 1 0 0 1 20.042 19.1 H 4.042 A 1 1 0 0 1 3.042 18.1 V 10.55 A 8.6 8.55 0 0 1 11.642 2 Z" />
      <Line x1="9" y1="22" x2="15" y2="22" />
    </Svg>
  )
}

// https://github.com/Remix-Design/RemixIcon/blob/master/License
export function BellIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size || 24}
      height={size || 24}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        d="M 11.642 2 H 12.442 A 8.6 8.55 0 0 1 21.042 10.55 V 18.1 A 1 1 0 0 1 20.042 19.1 H 4.042 A 1 1 0 0 1 3.042 18.1 V 10.55 A 8.6 8.55 0 0 1 11.642 2 Z"
        fill="currentColor"
      />
      <Line x1="9" y1="22" x2="15" y2="22" />
    </Svg>
  )
}

export function CogIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </Svg>
  )
}

export function CogIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 9.594 3.94 C 9.684 3.398 10.154 3 10.704 3 L 13.297 3 C 13.847 3 14.317 3.398 14.407 3.94 L 14.62 5.221 C 14.683 5.595 14.933 5.907 15.265 6.091 C 15.339 6.131 15.412 6.174 15.485 6.218 C 15.809 6.414 16.205 6.475 16.56 6.342 L 17.777 5.886 C 18.292 5.692 18.872 5.9 19.147 6.376 L 20.443 8.623 C 20.718 9.099 20.608 9.705 20.183 10.054 L 19.18 10.881 C 18.887 11.121 18.742 11.494 18.749 11.873 C 18.751 11.958 18.751 12.043 18.749 12.128 C 18.742 12.506 18.887 12.878 19.179 13.118 L 20.184 13.946 C 20.608 14.296 20.718 14.9 20.444 15.376 L 19.146 17.623 C 18.871 18.099 18.292 18.307 17.777 18.114 L 16.56 17.658 C 16.205 17.525 15.81 17.586 15.484 17.782 C 15.412 17.826 15.338 17.869 15.264 17.91 C 14.933 18.093 14.683 18.405 14.62 18.779 L 14.407 20.059 C 14.317 20.602 13.847 21 13.297 21 L 10.703 21 C 10.153 21 9.683 20.602 9.593 20.06 L 9.38 18.779 C 9.318 18.405 9.068 18.093 8.736 17.909 C 8.662 17.868 8.589 17.826 8.516 17.782 C 8.191 17.586 7.796 17.525 7.44 17.658 L 6.223 18.114 C 5.708 18.307 5.129 18.1 4.854 17.624 L 3.557 15.377 C 3.282 14.901 3.392 14.295 3.817 13.946 L 4.821 13.119 C 5.113 12.879 5.258 12.506 5.251 12.127 C 5.249 12.042 5.249 11.957 5.251 11.872 C 5.258 11.494 5.113 11.122 4.821 10.882 L 3.817 10.054 C 3.393 9.705 3.283 9.1 3.557 8.624 L 4.854 6.377 C 5.129 5.9 5.709 5.692 6.224 5.886 L 7.44 6.342 C 7.796 6.475 8.191 6.414 8.516 6.218 C 8.588 6.174 8.662 6.131 8.736 6.09 C 9.068 5.907 9.318 5.595 9.38 5.221 Z M 13.5 9.402 C 11.5 8.247 9 9.691 9 12 C 9 13.072 9.572 14.062 10.5 14.598 C 12.5 15.753 15 14.309 15 12 C 15 10.928 14.428 9.938 13.5 9.402 Z"
        fill="currentColor"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MoonIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function SunIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        d="M12 3V5.25M18.364 5.63604L16.773 7.22703M21 12H18.75M18.364 18.364L16.773 16.773M12 18.75V21M7.22703 16.773L5.63604 18.364M5.25 12H3M7.22703 7.22703L5.63604 5.63604M15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function UserIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </Svg>
  )
}

export function UserIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        d="M 15 9.75 C 15 12.059 12.5 13.503 10.5 12.348 C 9.572 11.812 9 10.822 9 9.75 C 9 7.441 11.5 5.997 13.5 7.152 C 14.428 7.688 15 8.678 15 9.75 Z"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        d="M 17.982 18.725 C 16.565 16.849 14.35 15.748 12 15.75 C 9.65 15.748 7.435 16.849 6.018 18.725 M 17.981 18.725 C 16.335 20.193 14.206 21.003 12 21 C 9.794 21.003 7.664 20.193 6.018 18.725"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 17.981 18.725 C 23.158 14.12 21.409 5.639 14.833 3.458 C 8.257 1.277 1.786 7.033 3.185 13.818 C 3.576 15.716 4.57 17.437 6.018 18.725 M 17.981 18.725 C 16.335 20.193 14.206 21.003 12 21 C 9.794 21.003 7.664 20.193 6.018 18.725"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function UserGroupIcon({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={2}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </Svg>
  )
}

export function RepostIcon({
  style,
  size = 24,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
        d="M 14.437 18.081 L 5.475 18.095 C 4.7 18.095 4.072 17.467 4.072 16.692 L 4.082 6.65 L 1.22 10.854 M 4.082 6.65 L 7.006 10.854 M 9.859 6.65 L 18.625 6.654 C 19.4 6.654 20.028 7.282 20.028 8.057 L 20.031 18.081 L 17.167 13.646 M 20.031 18.081 L 22.866 13.646"
      />
    </Svg>
  )
}

// Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
export function HeartIcon({
  style,
  size = 24,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="none"
        d="M 3.859 13.537 L 10.918 20.127 C 11.211 20.4 11.598 20.552 12 20.552 C 12.402 20.552 12.789 20.4 13.082 20.127 L 20.141 13.537 C 21.328 12.431 22 10.88 22 9.259 L 22 9.033 C 22 6.302 20.027 3.974 17.336 3.525 C 15.555 3.228 13.742 3.81 12.469 5.084 L 12 5.552 L 11.531 5.084 C 10.258 3.81 8.445 3.228 6.664 3.525 C 3.973 3.974 2 6.302 2 9.033 L 2 9.259 C 2 10.88 2.672 12.431 3.859 13.537 Z"
      />
    </Svg>
  )
}

// Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
export function HeartIconSolid({
  style,
  size = 24,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1}
        d="M 3.859 13.537 L 10.918 20.127 C 11.211 20.4 11.598 20.552 12 20.552 C 12.402 20.552 12.789 20.4 13.082 20.127 L 20.141 13.537 C 21.328 12.431 22 10.88 22 9.259 L 22 9.033 C 22 6.302 20.027 3.974 17.336 3.525 C 15.555 3.228 13.742 3.81 12.469 5.084 L 12 5.552 L 11.531 5.084 C 10.258 3.81 8.445 3.228 6.664 3.525 C 3.973 3.974 2 6.302 2 9.033 L 2 9.259 C 2 10.88 2.672 12.431 3.859 13.537 Z"
      />
    </Svg>
  )
}

export function UpIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={strokeWidth}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 3 L 2 8 L 4.5 8 L 4.5 11.5 L 9.5 11.5 L 9.5 8 L 12 8 L 7 3 Z"
      />
    </Svg>
  )
}

export function UpIconSolid({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={1.3}
        stroke="currentColor"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 3 L 2 8 L 4.5 8 L 4.5 11.5 L 9.5 11.5 L 9.5 8 L 12 8 L 7 3 Z"
      />
    </Svg>
  )
}

export function DownIcon({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={1.3}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 11.5 L 2 6.5 L 4.5 6.5 L 4.5 3 L 9.5 3 L 9.5 6.5 L 12 6.5 L 7 11.5 Z"
      />
    </Svg>
  )
}

export function DownIconSolid({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      viewBox="0 0 14 14"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeWidth={1.3}
        stroke="currentColor"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 7 11.5 L 2 6.5 L 4.5 6.5 L 4.5 3 L 9.5 3 L 9.5 6.5 L 12 6.5 L 7 11.5 Z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function CommentBottomArrow({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  let color = 'currentColor'
  if (
    style &&
    typeof style === 'object' &&
    'color' in style &&
    typeof style.color === 'string'
  ) {
    color = style.color
  }
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 2.5}
      stroke={color}
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </Svg>
  )
}

export function SquareIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="6" y="6" width="12" height="12" strokeLinejoin="round" />
    </Svg>
  )
}

export function RectWideIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="4" y="6" width="16" height="12" strokeLinejoin="round" />
    </Svg>
  )
}

export function RectTallIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="6" y="4" width="12" height="16" strokeLinejoin="round" />
    </Svg>
  )
}

export function ComposeIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </Svg>
  )
}

export function ComposeIcon2({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        d="M 20 9 L 20 16 C 20 18.209 18.209 20 16 20 L 8 20 C 5.791 20 4 18.209 4 16 L 4 8 C 4 5.791 5.791 4 8 4 L 15 4"
        strokeWidth={strokeWidth}
      />
      <Line
        strokeLinecap="round"
        x1="10"
        y1="14"
        x2="18.5"
        y2="5.5"
        strokeWidth={strokeWidth * 1.5}
      />
      <Line
        strokeLinecap="round"
        x1="20.5"
        y1="3.5"
        x2="21"
        y2="3"
        strokeWidth={strokeWidth * 1.5}
      />
    </Svg>
  )
}

export function SquarePlusIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Line
        strokeLinecap="round"
        strokeLinejoin="round"
        x1="12"
        y1="5.5"
        x2="12"
        y2="18.5"
        strokeWidth={strokeWidth * 1.5}
      />
      <Line
        strokeLinecap="round"
        strokeLinejoin="round"
        x1="5.5"
        y1="12"
        x2="18.5"
        y2="12"
        strokeWidth={strokeWidth * 1.5}
      />
      <Rect
        strokeWidth={strokeWidth}
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        ry="4"
      />
    </Svg>
  )
}

export function InfoCircleIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size}
      height={size}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </Svg>
  )
}

export function HandIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 76 76"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
      style={style}>
      <Path d="M33.5 37V11.5C33.5 8.46243 31.0376 6 28 6V6C24.9624 6 22.5 8.46243 22.5 11.5V48V48C22.5 48.5802 21.8139 48.8874 21.3811 48.501L13.2252 41.2189C10.72 38.9821 6.81945 39.4562 4.92296 42.228L4.77978 42.4372C3.17708 44.7796 3.50863 47.9385 5.56275 49.897L16.0965 59.9409C20.9825 64.5996 26.7533 68.231 33.0675 70.6201V70.6201C38.8234 72.798 45.1766 72.798 50.9325 70.6201L51.9256 70.2444C57.4044 68.1713 61.8038 63.9579 64.1113 58.5735V58.5735C65.6874 54.8962 66.5 50.937 66.5 46.9362V22.5C66.5 19.4624 64.0376 17 61 17V17C57.9624 17 55.5 19.4624 55.5 22.5V36.5" />
      <Path d="M55.5 37V11.5C55.5 8.46243 53.0376 6 50 6V6C46.9624 6 44.5 8.46243 44.5 11.5V37" />
      <Path d="M44.5 37V8.5C44.5 5.46243 42.0376 3 39 3V3C35.9624 3 33.5 5.46243 33.5 8.5V37" />
    </Svg>
  )
}

export function SatelliteDishIconSolid({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 22 22"
      style={style}
      fill="none"
      stroke="none">
      <Path
        d="M16 19.6622C14.5291 20.513 12.8214 21 11 21C5.47715 21 1 16.5229 1 11C1 9.17858 1.48697 7.47088 2.33782 6.00002C3.18867 4.52915 6 7.66219 6 7.66219L14.5 16.1622C14.5 16.1622 17.4709 18.8113 16 19.6622Z"
        fill="currentColor"
      />
      <Path
        d="M8 1.62961C9.04899 1.22255 10.1847 1 11.3704 1C16.6887 1 21 5.47715 21 11C21 12.0452 20.8456 13.053 20.5592 14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M9 5.38745C9.64553 5.13695 10.3444 5 11.0741 5C14.3469 5 17 7.75517 17 11.1538C17 11.797 16.905 12.4172 16.7287 13"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="10" cy="12" r="2" fill="currentColor" />
    </Svg>
  )
}

export function SatelliteDishIcon({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 22 22"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size}
      height={size}
      style={style}>
      <Path d="M5.25593 8.3303L5.25609 8.33047L5.25616 8.33056L5.25621 8.33061L5.27377 8.35018L5.29289 8.3693L13.7929 16.8693L13.8131 16.8895L13.8338 16.908L13.834 16.9081L13.8342 16.9083L13.8342 16.9083L13.8345 16.9086L13.8381 16.9118L13.8574 16.9294C13.8752 16.9458 13.9026 16.9711 13.9377 17.0043C14.0081 17.0708 14.1088 17.1683 14.2258 17.2881C14.4635 17.5315 14.7526 17.8509 14.9928 18.1812C15.2067 18.4755 15.3299 18.7087 15.3817 18.8634C14.0859 19.5872 12.5926 20 11 20C6.02944 20 2 15.9706 2 11C2 9.4151 2.40883 7.9285 3.12619 6.63699C3.304 6.69748 3.56745 6.84213 3.89275 7.08309C4.24679 7.34534 4.58866 7.65673 4.84827 7.9106C4.97633 8.03583 5.08062 8.14337 5.152 8.21863C5.18763 8.25619 5.21487 8.28551 5.23257 8.30473L5.25178 8.32572L5.25571 8.33006L5.25593 8.3303ZM3.00217 6.60712C3.00217 6.6071 3.00267 6.6071 3.00372 6.60715C3.00271 6.60716 3.00218 6.60714 3.00217 6.60712Z" />
      <Path
        d="M8 1.62961C9.04899 1.22255 10.1847 1 11.3704 1C16.6887 1 21 5.47715 21 11C21 12.0452 20.8456 13.053 20.5592 14"
        strokeLinecap="round"
      />
      <Path
        d="M9 5.38745C9.64553 5.13695 10.3444 5 11.0741 5C14.3469 5 17 7.75517 17 11.1538C17 11.797 16.905 12.4172 16.7287 13"
        strokeLinecap="round"
      />
      <Path
        d="M12 12C12 12.7403 11.5978 13.3866 11 13.7324L8.26756 11C8.61337 10.4022 9.25972 10 10 10C11.1046 10 12 10.8954 12 12Z"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  )
}
