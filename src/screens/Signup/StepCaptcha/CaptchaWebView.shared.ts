import {type SignupState} from '#/screens/Signup/state'

export type CaptchaWebViewProps = {
  url: string
  stateParam: string
  state?: SignupState
  onComplete: () => void
  onSuccess: (code: string) => void
  onError: (error: unknown) => void
}
