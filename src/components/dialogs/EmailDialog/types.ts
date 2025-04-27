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
    }
  | {
      id: ScreenID.Enable2FA
    }
  | {
      id: ScreenID.Disable2FA
    }

export enum ScreenID {
  Update = 'Update',
  Verify = 'Verify',
  Enable2FA = 'Enable2FA',
  Disable2FA = 'Disable2FA',
}
