import React from 'react'

import {IconProps} from './types.js'

export function PlayFilled({size, fill}: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.514 2.143A1 1 0 0 0 5 3v18a1 1 0 0 0 1.514.858l15-9a1 1 0 0 0 0-1.716l-15-9Z"
      />
    </svg>
  )
}
