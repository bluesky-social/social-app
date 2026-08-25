import {h} from 'preact'

type IconProps = {
  size: number
  className?: string
}

export function VerificationCheck({
  verifier,
  ...rest
}: {verifier: boolean} & IconProps) {
  return verifier ? <VerifierCheck {...rest} /> : <VerifiedCheck {...rest} />
}

export function VerifiedCheck({size, className}: IconProps) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}>
      <circle cx="12" cy="12" r="11.5" fill="hsl(211, 99%, 53%)" />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.659 8.175a1.361 1.361 0 0 1 0 1.925l-6.224 6.223a1.361 1.361 0 0 1-1.925 0L6.4 13.212a1.361 1.361 0 0 1 1.925-1.925l2.149 2.148 5.26-5.26a1.361 1.361 0 0 1 1.925 0Z"
      />
    </svg>
  )
}

export function VerifierCheck({size, className}: IconProps) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}>
      <path
        fill="hsl(211, 99%, 53%)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.792 1.615a4.154 4.154 0 0 1 6.416 0 4.154 4.154 0 0 0 3.146 1.515 4.154 4.154 0 0 1 4 5.017 4.154 4.154 0 0 0 .777 3.404 4.154 4.154 0 0 1-1.427 6.255 4.153 4.153 0 0 0-2.177 2.73 4.154 4.154 0 0 1-5.781 2.784 4.154 4.154 0 0 0-3.492 0 4.154 4.154 0 0 1-5.78-2.784 4.154 4.154 0 0 0-2.178-2.73A4.154 4.154 0 0 1 .87 11.551a4.154 4.154 0 0 0 .776-3.404A4.154 4.154 0 0 1 5.646 3.13a4.154 4.154 0 0 0 3.146-1.515Z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.861 8.26a1.438 1.438 0 0 1 0 2.033l-6.571 6.571a1.437 1.437 0 0 1-2.033 0L5.97 13.58a1.438 1.438 0 0 1 2.033-2.033l2.27 2.269 5.554-5.555a1.437 1.437 0 0 1 2.033 0Z"
      />
    </svg>
  )
}
