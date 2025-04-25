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

export enum ScreenID {
  Update = 'Update', // normal, instructs to click link first
  Verify = 'Verify', // as a separate step, instructs to click link first
}
