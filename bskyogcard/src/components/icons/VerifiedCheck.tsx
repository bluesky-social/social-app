import {IconProps} from './types.js'

export function VerifiedCheck({size, fill}: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="12" r="11.5" fill={fill} />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.659 8.175a1.361 1.361 0 0 1 0 1.925l-6.224 6.223a1.361 1.361 0 0 1-1.925 0L6.4 13.212a1.361 1.361 0 0 1 1.925-1.925l2.149 2.148 5.26-5.26a1.361 1.361 0 0 1 1.925 0Z"
      />
    </svg>
  )
}
