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
      hideInitialCodeButton?: boolean
      onVerify?: () => void
    }
  | {
      id: ScreenID.Manage2FA
    }

export enum ScreenID {
  Update = 'Update',
  Verify = 'Verify',
  Manage2FA = 'Manage2FA',
}
