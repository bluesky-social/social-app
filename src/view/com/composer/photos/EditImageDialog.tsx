import type React from 'react'

import {type ComposerImage} from '#/state/gallery'
import type * as Dialog from '#/components/Dialog'

export type EditImageDialogProps = {
  control: Dialog.DialogOuterProps['control']
  image?: ComposerImage
  onChange: (next: ComposerImage) => void
  aspectRatio?: number
  circularCrop?: boolean
}

export const EditImageDialog = ({}: EditImageDialogProps): React.ReactNode => {
  return null
}
