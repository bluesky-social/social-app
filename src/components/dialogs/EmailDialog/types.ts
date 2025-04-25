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
      /**
       * - default flow
       * - new user blockers (x5)
       */
      instructions?: ReactNode[]
      // onCloseWithoutVerifying,
      // onCloseAfterVerifying,
    }

export enum ScreenID {
  Update = 'Update', // normal, instructs to click link first
  Verify = 'Verify', // as a separate step, instructs to click link first
}
