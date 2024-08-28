import React from 'react'

export function CircleInfo({size, fill}: {size: number; fill?: string}) {
  return (
    <svg fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm8-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-4a1 1 0 0 1-1-1Zm1-3a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z"
      />
    </svg>
  )
}
