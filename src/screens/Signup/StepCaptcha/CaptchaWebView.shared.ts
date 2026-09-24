import {type SignupState} from '#/screens/Signup/state'

export type CaptchaFailureReason =
  'state-mismatch' | 'webview-error' | 'http-error'

export type CaptchaError = {
  reason: CaptchaFailureReason
  /** Hostname only - the full URL carries the user's handle. */
  host?: string
  statusCode?: number
  /** Underlying platform error, for logging only. */
  cause?: unknown
}

export type CaptchaWebViewProps = {
  url: string
  stateParam: string
  state?: SignupState
  onComplete: () => void
  onSuccess: (code: string) => void
  onError: (error: CaptchaError) => void
  /** The user is still working on the challenge after a grace period. */
  onSlow?: () => void
  /** A navigation was refused by the host allowlist. */
  onBlockedLoad?: (host: string, isTopFrame: boolean) => void
}
