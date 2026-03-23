import {type ReactNode} from 'react'

import {type DialogControlProps} from '#/components/Dialog'

export type EmailDialogProps = {
  control: DialogControlProps
}

export type EmailDialogInnerProps = EmailDialogProps & {}

export type Screen =
  | {
      id: ScreenID.Update
    }
  | {
      id: ScreenID.Verify
      instructions?: ReactNode[]
      onVerify?: () => void
      onCloseWithoutVerifying?: () => void
    }
  | {
      id: ScreenID.VerificationReminder
    }
  | {
      id: ScreenID.Manage2FA
    }

export enum ScreenID {
  Update = 'Update',
  Verify = 'Verify',
  VerificationReminder = 'VerificationReminder',
  Manage2FA = 'Manage2FA',
}

export type ScreenProps<T extends ScreenID> = {
  config: Extract<Screen, {id: T}>
  showScreen: (screen: Screen) => void
}
