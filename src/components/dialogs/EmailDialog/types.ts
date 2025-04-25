import {type ReactNode} from 'react'

import {type DialogControlProps} from '#/components/Dialog'

export type EmailDialogProps = {
  control: DialogControlProps
}

export type EmailDialogInnerProps = EmailDialogProps & {}

export type Screen = {
  id: ScreenID.Update
} | {
  id: ScreenID.EnterCode
  /**
   * - email was sent earlier
   * - email was _just_ sent
   */
  instructions: ReactNode[]
} | {
  id: ScreenID.VerifyEmail
  /**
   * - default flow
   * - new user blockers (x5)
   */
  instructions: ReactNode[]
  // onCloseWithoutVerifying,
  // onCloseAfterVerifying,
}

export enum ScreenID {
  Update = 'Update', // normal, instructs to click link first
  EnterCode = 'EnterCode', // if user elects to enter a code
  VerifyEmail = 'VerifyEmail', // as a separate step, instructs to click link first
}
